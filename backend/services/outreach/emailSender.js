/**
 * Email Sender
 * 
 * Handles email delivery via SMTP or API (SendGrid, Mailgun, etc.)
 * Tracks delivery status and manages sending limits.
 */

const nodemailer = require('nodemailer');

class EmailSender {
    constructor() {
        this.transporter = null;
        this.dailySentCount = 0;
        this.lastResetDate = new Date().toDateString();

        this.config = {
            host: process.env.OUTREACH_SMTP_HOST || process.env.SMTP_HOST,
            port: parseInt(process.env.OUTREACH_SMTP_PORT || process.env.SMTP_PORT || '587'),
            user: process.env.OUTREACH_SMTP_USER || process.env.SMTP_USER,
            pass: process.env.OUTREACH_SMTP_PASS || process.env.SMTP_PASS,
            fromEmail: process.env.OUTREACH_FROM_EMAIL || process.env.FROM_EMAIL || 'outreach@greenchainz.com',
            fromName: process.env.OUTREACH_FROM_NAME || 'GreenChainz',
            dailyLimit: parseInt(process.env.OUTREACH_DAILY_LIMIT || '200'),
            batchSize: parseInt(process.env.OUTREACH_BATCH_SIZE || '50')
        };
    }

    /**
     * Initialize the email transporter
     */
    initTransporter() {
        if (this.transporter) return this.transporter;

        if (!this.config.host || !this.config.user || !this.config.pass) {
            console.warn('[EmailSender] SMTP not configured, emails will be simulated');
            return null;
        }

        this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.port === 465,
            auth: {
                user: this.config.user,
                pass: this.config.pass
            }
        });

        return this.transporter;
    }

    /**
     * Send a single email
     */
    async send(emailData) {
        const { to, subject, body, html, replyTo, trackingId } = emailData;

        // Check daily limit
        this.checkDailyReset();
        if (this.dailySentCount >= this.config.dailyLimit) {
            return {
                success: false,
                error: 'Daily sending limit reached',
                limitReached: true
            };
        }

        const transporter = this.initTransporter();

        // If no transporter, simulate send
        if (!transporter) {
            console.log(`[EmailSender] SIMULATED: Would send to ${to}: "${subject}"`);
            this.dailySentCount++;
            return {
                success: true,
                simulated: true,
                messageId: `simulated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                to,
                subject
            };
        }

        try {
            // Add tracking pixel if trackingId provided
            const htmlBody = html || this.textToHtml(body, trackingId);

            const mailOptions = {
                from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
                to,
                subject,
                text: body,
                html: htmlBody,
                replyTo: replyTo || this.config.fromEmail,
                headers: {
                    'X-GreenChainz-Tracking-ID': trackingId || '',
                    'X-Mailer': 'GreenChainz Outreach'
                }
            };

            const result = await transporter.sendMail(mailOptions);
            this.dailySentCount++;

            console.log(`[EmailSender] Sent to ${to}: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId,
                to,
                subject,
                sentAt: new Date().toISOString()
            };
        } catch (err) {
            console.error(`[EmailSender] Failed to send to ${to}:`, err.message);

            return {
                success: false,
                error: err.message,
                to,
                subject,
                isBounce: this.isBounceError(err)
            };
        }
    }

    /**
     * Send emails in batch with rate limiting
     */
    async sendBatch(emails, options = {}) {
        const { delayMs = 1000, onProgress } = options;
        const results = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];

            // Check if we've hit the daily limit
            if (this.dailySentCount >= this.config.dailyLimit) {
                results.push({
                    ...email,
                    success: false,
                    error: 'Daily limit reached',
                    skipped: true
                });
                continue;
            }

            const result = await this.send(email);
            results.push({ ...email, ...result });

            // Callback for progress tracking
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: emails.length,
                    lastResult: result
                });
            }

            // Delay between sends to avoid rate limiting
            if (i < emails.length - 1) {
                await this.delay(delayMs);
            }
        }

        return {
            total: emails.length,
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success && !r.skipped).length,
            skipped: results.filter(r => r.skipped).length,
            results
        };
    }

    /**
     * Convert plain text to HTML with optional tracking
     */
    textToHtml(text, trackingId) {
        // Convert line breaks to <br> tags
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Wrap in basic HTML
        html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${html}
  </div>
  ${trackingId ? this.getTrackingPixel(trackingId) : ''}
</body>
</html>
    `.trim();

        return html;
    }

    /**
     * Generate a tracking pixel HTML
     */
    getTrackingPixel(trackingId) {
        const trackingUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/v1/outreach/track/open?id=${trackingId}`;
        return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
    }

    /**
     * Check if error indicates a bounce
     */
    isBounceError(err) {
        const bounceIndicators = [
            'user unknown',
            'mailbox not found',
            'recipient rejected',
            'address rejected',
            '550',
            '551',
            '552',
            '553',
            '554'
        ];

        const errorStr = err.message.toLowerCase();
        return bounceIndicators.some(indicator => errorStr.includes(indicator));
    }

    /**
     * Reset daily counter if it's a new day
     */
    checkDailyReset() {
        const today = new Date().toDateString();
        if (today !== this.lastResetDate) {
            this.dailySentCount = 0;
            this.lastResetDate = today;
        }
    }

    /**
     * Get current sending stats
     */
    getStats() {
        this.checkDailyReset();
        return {
            dailySent: this.dailySentCount,
            dailyLimit: this.config.dailyLimit,
            remainingToday: this.config.dailyLimit - this.dailySentCount,
            configured: !!this.config.host
        };
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection() {
        const transporter = this.initTransporter();

        if (!transporter) {
            return { valid: false, error: 'SMTP not configured' };
        }

        try {
            await transporter.verify();
            return { valid: true };
        } catch (err) {
            return { valid: false, error: err.message };
        }
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = EmailSender;
