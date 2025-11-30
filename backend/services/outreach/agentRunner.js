/**
 * Agent Runner
 * 
 * Orchestrates the outreach agent:
 * - Runs on a cron schedule
 * - Processes contacts due for outreach
 * - Generates and sends emails
 * - Logs all activity
 */

const cron = require('node-cron');

class AgentRunner {
    constructor(outreachService) {
        this.service = outreachService;
        this.cronJob = null;
        this.isRunning = false;
        this.schedule = process.env.OUTREACH_CRON_SCHEDULE || '0 9 * * 1-5'; // 9 AM weekdays
    }

    /**
     * Start the cron scheduler
     */
    startScheduler() {
        if (this.cronJob) {
            console.log('[AgentRunner] Scheduler already running');
            return;
        }

        // Validate cron expression
        if (!cron.validate(this.schedule)) {
            console.error('[AgentRunner] Invalid cron schedule:', this.schedule);
            return;
        }

        this.cronJob = cron.schedule(this.schedule, async () => {
            console.log('[AgentRunner] Scheduled run triggered');
            await this.run({ type: 'scheduled' });
        });

        console.log(`[AgentRunner] Scheduler started with schedule: ${this.schedule}`);
    }

    /**
     * Stop the cron scheduler
     */
    stopScheduler() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('[AgentRunner] Scheduler stopped');
        }
    }

    /**
     * Run the outreach agent
     */
    async run(options = {}) {
        if (this.isRunning) {
            console.log('[AgentRunner] Agent already running, skipping');
            return { success: false, error: 'Agent already running' };
        }

        this.isRunning = true;
        const startTime = Date.now();
        let runId = null;

        try {
            // Load active instructions from database
            const instructions = await this.service.getActiveInstructions();
            console.log(`[AgentRunner] Loaded ${Object.keys(instructions).length} active instructions`);

            // Store instructions in instance for use by processing methods
            this.activeInstructions = instructions;

            // Log run start
            const runResult = await this.service.pool.query(`
        INSERT INTO Outreach_Agent_Runs (RunType, Status)
        VALUES ($1, 'running')
        RETURNING RunID
      `, [options.type || 'manual']);
            runId = runResult.rows[0].runid;

            console.log(`[AgentRunner] Run ${runId} started`);

            const results = {
                contactsProcessed: 0,
                emailsSent: 0,
                errors: [],
                instructionsUsed: Object.keys(instructions)
            };

            // Get active campaigns
            const campaigns = await this.service.campaignManager.getCampaigns({ status: 'active' });

            for (const campaign of campaigns) {
                try {
                    const campaignResults = await this.processCampaign(campaign);
                    results.contactsProcessed += campaignResults.processed;
                    results.emailsSent += campaignResults.sent;
                    results.errors.push(...campaignResults.errors);
                } catch (err) {
                    console.error(`[AgentRunner] Campaign ${campaign.campaignid} error:`, err);
                    results.errors.push({ campaignId: campaign.campaignid, error: err.message });
                }
            }

            // Also process any standalone contacts not in campaigns
            if (options.includeStandalone !== false) {
                const standaloneResults = await this.processStandaloneContacts();
                results.contactsProcessed += standaloneResults.processed;
                results.emailsSent += standaloneResults.sent;
                results.errors.push(...standaloneResults.errors);
            }

            // Log run completion
            const duration = Date.now() - startTime;
            await this.service.pool.query(`
        UPDATE Outreach_Agent_Runs 
        SET Status = 'completed', 
            ContactsProcessed = $1, 
            EmailsSent = $2, 
            Errors = $3,
            CompletedAt = CURRENT_TIMESTAMP,
            DurationMs = $4
        WHERE RunID = $5
      `, [results.contactsProcessed, results.emailsSent, JSON.stringify(results.errors), duration, runId]);

            console.log(`[AgentRunner] Run ${runId} completed in ${duration}ms. Sent ${results.emailsSent} emails to ${results.contactsProcessed} contacts.`);

            return {
                success: true,
                runId,
                ...results,
                durationMs: duration
            };

        } catch (err) {
            console.error('[AgentRunner] Run failed:', err);

            if (runId) {
                await this.service.pool.query(`
          UPDATE Outreach_Agent_Runs 
          SET Status = 'failed', 
              Errors = $1,
              CompletedAt = CURRENT_TIMESTAMP,
              DurationMs = $2
          WHERE RunID = $3
        `, [JSON.stringify([{ error: err.message }]), Date.now() - startTime, runId]);
            }

            return { success: false, error: err.message };

        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process a single campaign
     */
    async processCampaign(campaign) {
        const results = { processed: 0, sent: 0, errors: [] };

        // Get contacts due for next step
        const contacts = await this.service.campaignManager.getContactsDueForNextStep(
            campaign.campaignid,
            parseInt(process.env.OUTREACH_BATCH_SIZE || '50')
        );

        for (const contact of contacts) {
            try {
                // Check conditions (skip if opened, etc.)
                const contactEvents = await this.service.pool.query(
                    'SELECT EventType FROM Outreach_Events WHERE ContactID = $1 AND CampaignID = $2',
                    [contact.contactid, campaign.campaignid]
                );

                const conditions = contact.conditions || {};
                if (this.service.campaignManager.shouldSkipStep(conditions, contactEvents.rows)) {
                    // Advance to next step without sending
                    await this.service.campaignManager.advanceToNextStep(contact.enrollmentid, campaign.campaignid);
                    continue;
                }

                // Generate email with custom instructions
                const email = await this.service.emailGenerator.generateEmail(contact, {
                    template: contact.emailtemplate || 'cold_outreach',
                    campaignContext: {
                        targetAudience: campaign.targetaudience,
                        touchNumber: contact.currentstep
                    },
                    customInstructions: this.activeInstructions
                });

                // Send email
                const trackingId = `${contact.contactid}_${campaign.campaignid}_${contact.sequenceid}_${Date.now()}`;
                const sendResult = await this.service.emailSender.send({
                    to: contact.email,
                    subject: contact.emailsubject || email.subject,
                    body: email.body,
                    trackingId
                });

                results.processed++;

                if (sendResult.success) {
                    results.sent++;

                    // Log sent event
                    await this.service.analytics.logEvent({
                        contactId: contact.contactid,
                        campaignId: campaign.campaignid,
                        sequenceId: contact.sequenceid,
                        eventType: 'sent',
                        emailSubject: email.subject,
                        emailBody: email.body,
                        messageId: sendResult.messageId,
                        metadata: { simulated: sendResult.simulated, trackingId }
                    });

                    // Update contact's last contacted time
                    await this.service.leadService.markContacted(contact.contactid);

                    // Advance to next step
                    await this.service.campaignManager.advanceToNextStep(contact.enrollmentid, campaign.campaignid);

                } else {
                    // Log failure
                    results.errors.push({
                        contactId: contact.contactid,
                        error: sendResult.error
                    });

                    // If bounce, update contact status
                    if (sendResult.isBounce) {
                        await this.service.leadService.updateStatus(contact.contactid, 'bounced', sendResult.error);
                        await this.service.campaignManager.exitCampaign(contact.contactid, campaign.campaignid, 'bounced');
                    }
                }

            } catch (err) {
                console.error(`[AgentRunner] Contact ${contact.contactid} error:`, err);
                results.errors.push({ contactId: contact.contactid, error: err.message });
            }
        }

        return results;
    }

    /**
     * Process contacts not enrolled in any campaign
     */
    async processStandaloneContacts() {
        const results = { processed: 0, sent: 0, errors: [] };

        // Get new contacts not in any campaign, with high lead score
        const contacts = await this.service.leadService.getContactsForOutreach({
            minScore: 50,
            daysSinceLastContact: 7,
            limit: 20
        });

        // Filter to only those not in any active campaign
        const enrolledResult = await this.service.pool.query(`
      SELECT DISTINCT ContactID FROM Outreach_Enrollments WHERE Status = 'active'
    `);
        const enrolledIds = new Set(enrolledResult.rows.map(r => r.contactid));

        const standaloneContacts = contacts.filter(c => !enrolledIds.has(c.contactid));

        for (const contact of standaloneContacts) {
            try {
                // Generate and send a cold outreach email with custom instructions
                const email = await this.service.emailGenerator.generateEmail(contact, {
                    template: 'cold_outreach',
                    campaignContext: { targetAudience: contact.contacttype },
                    customInstructions: this.activeInstructions
                });

                const trackingId = `standalone_${contact.contactid}_${Date.now()}`;
                const sendResult = await this.service.emailSender.send({
                    to: contact.email,
                    subject: email.subject,
                    body: email.body,
                    trackingId
                });

                results.processed++;

                if (sendResult.success) {
                    results.sent++;

                    await this.service.analytics.logEvent({
                        contactId: contact.contactid,
                        eventType: 'sent',
                        emailSubject: email.subject,
                        emailBody: email.body,
                        messageId: sendResult.messageId,
                        metadata: { standalone: true, trackingId }
                    });

                    await this.service.leadService.markContacted(contact.contactid);
                } else {
                    results.errors.push({ contactId: contact.contactid, error: sendResult.error });
                }

            } catch (err) {
                results.errors.push({ contactId: contact.contactid, error: err.message });
            }
        }

        return results;
    }

    /**
     * Get run history
     */
    async getRunHistory(limit = 20) {
        const result = await this.service.pool.query(`
      SELECT * FROM Outreach_Agent_Runs
      ORDER BY StartedAt DESC
      LIMIT $1
    `, [limit]);

        return result.rows;
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            schedulerActive: !!this.cronJob,
            schedule: this.schedule,
            nextRun: this.cronJob ? 'Based on cron schedule' : 'Not scheduled'
        };
    }
}

module.exports = AgentRunner;
