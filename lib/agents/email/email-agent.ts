import { zohoClient } from './zoho-client';
import { FOUNDING_50_TEMPLATE, FOLLOW_UP_TEMPLATE } from './templates/founding-50';
import { createClient } from '@/lib/supabase/server';
import { logAgentActivity } from '../monitoring';

interface EmailTask {
    type: 'outreach' | 'follow_up' | 'response';
    recipientEmail: string;
    recipientName: string;
    companyName: string;
    supplierId: string;
    metadata?: Record<string, unknown>;
}

export class EmailAgent {
    private queue: EmailTask[] = [];

    async addTask(task: EmailTask) {
        this.queue.push(task);
    }

    async processBatch(batchSize: number = 10) {
        const batch = this.queue.splice(0, batchSize);
        const results = await Promise.all(batch.map(task => this.sendEmail(task)));
        return results;
    }

    private async sendEmail(task: EmailTask) {
        const supabase = await createClient();

        try {
            let subject: string;
            let body: string;

            // Basic split with fallback to empty string if name is missing/malformed
            const firstName = task.recipientName ? task.recipientName.split(' ')[0] : 'there';

            if (task.type === 'outreach') {
                subject = FOUNDING_50_TEMPLATE.subject(task.companyName);
                body = FOUNDING_50_TEMPLATE.body({
                    firstName: firstName,
                    companyName: task.companyName
                });
            } else if (task.type === 'follow_up') {
                subject = FOLLOW_UP_TEMPLATE.subject;
                body = FOLLOW_UP_TEMPLATE.body(firstName);
            } else {
                throw new Error('Unsupported email type');
            }

            // Send via Zoho
            // Check if credentials exist before trying, to avoid crashes in dev if not set
            if (!process.env['ZOHO_CLIENT_ID']) {
                console.warn('Skipping email send: Zoho credentials not set');
                return { success: false, error: 'Missing credentials' };
            }

            await zohoClient.sendEmail({
                to: task.recipientEmail,
                subject,
                body
            });

            // Log to Supabase
            await supabase.from('email_log').insert({
                supplier_id: task.supplierId,
                type: task.type,
                recipient_email: task.recipientEmail,
                subject,
                sent_at: new Date().toISOString(),
                status: 'sent'
            });

            await logAgentActivity({
                agentType: 'email',
                action: 'send_email',
                status: 'success',
                metadata: { recipient: task.recipientEmail, type: task.type }
            });

            return { success: true, taskType: task.type, recipient: task.recipientEmail };
        } catch (error: unknown) {
            console.error(`Email failed for ${task.recipientEmail}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await logAgentActivity({
                agentType: 'email',
                action: 'send_email',
                status: 'error',
                metadata: { recipient: task.recipientEmail, error: errorMessage }
            });

            return { success: false, taskType: task.type, recipient: task.recipientEmail, error };
        }
    }

    async checkResponses() {
        if (!process.env['ZOHO_CLIENT_ID']) {
            return;
        }

        const inbox = await zohoClient.checkInbox();

        // Parse responses and update supplier status with a single batch insert
        const supabase = await createClient();
        const relevantEmails = (inbox.data || []).filter(
            email => email.subject.includes('GreenChainz') || email.subject.includes('Founding 50')
        );

        if (relevantEmails.length > 0) {
            // Batch insert all email logs in a single database operation
            await supabase.from('email_log').insert(
                relevantEmails.map(email => ({
                    type: 'response_received',
                    recipient_email: email.fromAddress,
                    subject: email.subject,
                    received_at: new Date().toISOString()
                }))
            );
        }
    }
}

export const emailAgent = new EmailAgent();
