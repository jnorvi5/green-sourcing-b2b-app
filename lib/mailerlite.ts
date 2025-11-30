/**
 * MailerLite Email Service
 * 
 * Handles transactional emails (RFQ notifications, welcome emails, etc.)
 * and marketing campaigns via MailerLite API
 */

import { connectToDatabase } from './mongodb';

// MailerLite API Configuration
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_BASE_URL = 'https://connect.mailerlite.com/api';

interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    replyTo?: string;
}

interface SubscriberData {
    email: string;
    fields?: {
        name?: string;
        company?: string;
        role?: string;
        [key: string]: string | undefined;
    };
    groups?: string[];
}

interface CampaignData {
    name: string;
    subject: string;
    from: string;
    fromName: string;
    groupIds: string[];
    content: string;
}

// Helper to make API requests
async function makeMailerLiteRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
) {
    const response = await fetch(`${MAILERLITE_BASE_URL}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`MailerLite API error: ${response.status} - ${error}`);
    }

    return response.json();
}

/**
 * Send a transactional email via MailerLite
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        // Log email to database for tracking
        const { db } = await connectToDatabase();
        await db.collection('email_logs').insertOne({
            to: options.to,
            subject: options.subject,
            status: 'sending',
            createdAt: new Date(),
        });

        // For development/testing without API key
        if (!MAILERLITE_API_KEY) {
            console.log('[DEV] Email would be sent:', {
                to: options.to,
                subject: options.subject,
            });
            return { success: true, messageId: 'dev-' + Date.now() };
        }

        // Send via MailerLite transactional API
        const result = await makeMailerLiteRequest('/campaigns', 'POST', {
            type: 'transactional',
            emails: Array.isArray(options.to) ? options.to : [options.to],
            from: options.from || process.env.EMAIL_FROM || 'noreply@greenchainz.com',
            from_name: options.fromName || 'GreenChainz',
            subject: options.subject,
            content: {
                html: options.html,
            },
        });

        // Update log
        await db.collection('email_logs').updateOne(
            { to: options.to, subject: options.subject, status: 'sending' },
            { $set: { status: 'sent', messageId: result.data?.id, sentAt: new Date() } }
        );

        return { success: true, messageId: result.data?.id };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Add or update a subscriber in MailerLite
 */
export async function addSubscriber(data: SubscriberData): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
    try {
        if (!MAILERLITE_API_KEY) {
            console.log('[DEV] Subscriber would be added:', data);
            return { success: true, subscriberId: 'dev-' + Date.now() };
        }

        const result = await makeMailerLiteRequest('/subscribers', 'POST', {
            email: data.email,
            fields: data.fields,
            groups: data.groups,
        });

        return { success: true, subscriberId: result.data?.id };
    } catch (error) {
        console.error('Failed to add subscriber:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Remove subscriber from MailerLite
 */
function isValidEmail(email: string): boolean {
    // Very basic email regex (does not allow slashes or dangerous chars)
    return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
}

export async function removeSubscriber(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!isValidEmail(email)) {
            console.error('Attempt to remove subscriber with invalid email:', email);
            return { success: false, error: 'Invalid email address' };
        }
        if (!MAILERLITE_API_KEY) {
            console.log('[DEV] Subscriber would be removed:', email);
            return { success: true };
        }

        // Get subscriber ID first
        const subscriber = await makeMailerLiteRequest(`/subscribers/${email}`);
        if (subscriber.data?.id) {
            await makeMailerLiteRequest(`/subscribers/${subscriber.data.id}`, 'DELETE');
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to remove subscriber:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Get all subscriber groups from MailerLite
 */
export async function getGroups(): Promise<{ id: string; name: string; count: number }[]> {
    try {
        if (!MAILERLITE_API_KEY) {
            return [
                { id: 'dev-buyers', name: 'Buyers', count: 150 },
                { id: 'dev-suppliers', name: 'Suppliers', count: 75 },
                { id: 'dev-newsletter', name: 'Newsletter', count: 500 },
            ];
        }

        const result = await makeMailerLiteRequest('/groups');
        return result.data?.map((g: any) => ({
            id: g.id,
            name: g.name,
            count: g.active_count || 0,
        })) || [];
    } catch (error) {
        console.error('Failed to get groups:', error);
        return [];
    }
}

/**
 * Create an email campaign
 */
export async function createCampaign(data: CampaignData): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
        if (!MAILERLITE_API_KEY) {
            console.log('[DEV] Campaign would be created:', data);
            return { success: true, campaignId: 'dev-' + Date.now() };
        }

        const result = await makeMailerLiteRequest('/campaigns', 'POST', {
            name: data.name,
            type: 'regular',
            emails: [{
                subject: data.subject,
                from: data.from,
                from_name: data.fromName,
                content: {
                    html: data.content,
                },
            }],
            groups: data.groupIds,
        });

        return { success: true, campaignId: result.data?.id };
    } catch (error) {
        console.error('Failed to create campaign:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// ============ Email Templates ============

/**
 * Generate welcome email for new users
 */
export function generateWelcomeEmail(data: {
    name: string;
    email: string;
    role: 'buyer' | 'supplier';
    company?: string;
}): string {
    const dashboardUrl = data.role === 'buyer'
        ? 'https://greenchainz.com/dashboard/buyer'
        : 'https://greenchainz.com/dashboard/supplier';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GreenChainz</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://greenchainz.com/logo.png" alt="GreenChainz" style="height: 40px;" />
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      <h1 style="color: #10b981; margin: 0 0 16px 0; font-size: 24px;">
        Welcome to GreenChainz, ${data.name}! 🌱
      </h1>
      
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${data.role === 'buyer'
            ? `Thank you for joining GreenChainz! You now have access to thousands of verified sustainable building materials with transparent carbon data.`
            : `Thank you for becoming a GreenChainz supplier! Start showcasing your sustainable products to eco-conscious buyers looking for verified materials.`
        }
      </p>

      <div style="background-color: #111827; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">🚀 Get Started</h3>
        <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
          ${data.role === 'buyer' ? `
            <li>Search our marketplace for sustainable materials</li>
            <li>Compare carbon footprints across products</li>
            <li>Send RFQs directly to verified suppliers</li>
            <li>Track your project's environmental impact</li>
          ` : `
            <li>Complete your company profile</li>
            <li>Add your products with EPD documentation</li>
            <li>Start receiving quote requests</li>
            <li>Track your sales analytics</li>
          `}
        </ul>
      </div>

      <a href="${dashboardUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        Need help? <a href="https://greenchainz.com/support" style="color: #10b981; text-decoration: none;">Contact our support team</a>
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} GreenChainz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate RFQ notification email for suppliers
 */
export function generateRfqNotificationEmail(data: {
    supplierName: string;
    rfqNumber: string;
    productName: string;
    quantity: number;
    unit: string;
    buyerCompany: string;
    project: string;
    deliveryLocation: string;
    deliveryDate: string;
    expiresIn: string;
    viewUrl: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New RFQ Request</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://greenchainz.com/logo.png" alt="GreenChainz" style="height: 40px;" />
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      <!-- Alert Banner -->
      <div style="background-color: #065f46; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">📬 NEW RFQ REQUEST</span>
      </div>

      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px;">
        Hi ${data.supplierName},
      </h1>
      
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        You've received a new quote request for <strong style="color: #10b981;">${data.productName}</strong>
      </p>

      <!-- RFQ Details Card -->
      <div style="background-color: #111827; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #374151;">
          <span style="color: #9ca3af; font-size: 14px;">RFQ Number</span>
          <span style="color: #ffffff; font-weight: 600;">${data.rfqNumber}</span>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Quantity</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.quantity.toLocaleString()} ${data.unit}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Buyer</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.buyerCompany}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Project</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.project}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Delivery Location</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.deliveryLocation}</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Delivery Date</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.deliveryDate}</td>
          </tr>
        </table>
      </div>

      <!-- Urgency Notice -->
      <div style="background-color: #7c2d12; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <span style="color: #fed7aa; font-size: 14px;">⏰ Quote expires in <strong>${data.expiresIn}</strong></span>
      </div>

      <a href="${data.viewUrl}" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
        View RFQ & Submit Quote →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        Don't want these notifications? <a href="https://greenchainz.com/settings/notifications" style="color: #10b981; text-decoration: none;">Manage preferences</a>
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} GreenChainz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate quote received notification for buyers
 */
export function generateQuoteReceivedEmail(data: {
    buyerName: string;
    rfqNumber: string;
    productName: string;
    supplierName: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    leadTime: number;
    validUntil: string;
    viewUrl: string;
}): string {
    const totalPrice = data.unitPrice * data.quantity;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://greenchainz.com/logo.png" alt="GreenChainz" style="height: 40px;" />
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      <!-- Alert Banner -->
      <div style="background-color: #1e3a5f; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
        <span style="color: #93c5fd; font-size: 14px; font-weight: 600;">💰 QUOTE RECEIVED</span>
      </div>

      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px;">
        Hi ${data.buyerName},
      </h1>
      
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Great news! <strong style="color: #10b981;">${data.supplierName}</strong> has submitted a quote for your RFQ.
      </p>

      <!-- Quote Details Card -->
      <div style="background-color: #111827; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #374151;">
          <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase;">Product</span>
          <div style="color: #ffffff; font-size: 18px; font-weight: 600; margin-top: 4px;">${data.productName}</div>
          <div style="color: #6b7280; font-size: 14px;">${data.rfqNumber}</div>
        </div>
        
        <!-- Price Highlight -->
        <div style="background-color: #065f46; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
          <div style="color: #6ee7b7; font-size: 14px; margin-bottom: 4px;">Total Quote</div>
          <div style="color: #ffffff; font-size: 32px; font-weight: 700;">$${totalPrice.toLocaleString()}</div>
          <div style="color: #a7f3d0; font-size: 14px;">$${data.unitPrice.toLocaleString()}/${data.unit.replace(/s$/, '')} × ${data.quantity.toLocaleString()}</div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Lead Time</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.leadTime} days</td>
          </tr>
          <tr>
            <td style="color: #9ca3af; font-size: 14px; padding: 8px 0;">Quote Valid Until</td>
            <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${data.validUntil}</td>
          </tr>
        </table>
      </div>

      <a href="${data.viewUrl}" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
        Review Quote & Respond →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">
        <a href="https://greenchainz.com/support" style="color: #10b981; text-decoration: none;">Contact support</a> if you have questions
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} GreenChainz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generate carbon report email
 */
export function generateCarbonReportEmail(data: {
    userName: string;
    reportPeriod: string;
    totalCo2e: number;
    comparison: number; // percentage change from previous period
    projectCount: number;
    topCategory: string;
    downloadUrl: string;
}): string {
    const isReduction = data.comparison < 0;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Carbon Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <img src="https://greenchainz.com/logo.png" alt="GreenChainz" style="height: 40px;" />
    </div>
    
    <!-- Main Content -->
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px;">
        🌍 Your Carbon Report - ${data.reportPeriod}
      </h1>
      
      <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${data.userName}, here's your environmental impact summary.
      </p>

      <!-- Main Metric -->
      <div style="background: linear-gradient(135deg, #065f46, #047857); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <div style="color: #a7f3d0; font-size: 14px; margin-bottom: 8px;">TOTAL EMBODIED CARBON</div>
        <div style="color: #ffffff; font-size: 48px; font-weight: 700;">${(data.totalCo2e / 1000).toFixed(1)}</div>
        <div style="color: #6ee7b7; font-size: 18px;">tonnes CO2e</div>
        
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.2);">
          <span style="display: inline-block; background-color: ${isReduction ? '#065f46' : '#7c2d12'}; color: ${isReduction ? '#6ee7b7' : '#fed7aa'}; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${isReduction ? '↓' : '↑'} ${Math.abs(data.comparison)}% vs previous period
          </span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #111827; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">PROJECTS</div>
          <div style="color: #ffffff; font-size: 24px; font-weight: 600;">${data.projectCount}</div>
        </div>
        <div style="flex: 1; background-color: #111827; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="color: #9ca3af; font-size: 12px; margin-bottom: 4px;">TOP CATEGORY</div>
          <div style="color: #ffffff; font-size: 14px; font-weight: 600;">${data.topCategory}</div>
        </div>
      </div>

      ${isReduction ? `
      <div style="background-color: #065f46; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <span style="color: #6ee7b7; font-size: 14px;">
          🎉 Great job! You've reduced your carbon footprint compared to the previous period.
        </span>
      </div>
      ` : `
      <div style="background-color: #1e3a5f; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <span style="color: #93c5fd; font-size: 14px;">
          💡 Consider exploring our low-carbon alternatives to reduce your impact.
        </span>
      </div>
      `}

      <a href="${data.downloadUrl}" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
        Download Full Report (PDF) →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">
        © ${new Date().getFullYear()} GreenChainz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export default {
    sendEmail,
    addSubscriber,
    removeSubscriber,
    getGroups,
    createCampaign,
    generateWelcomeEmail,
    generateRfqNotificationEmail,
    generateQuoteReceivedEmail,
    generateCarbonReportEmail,
};
