/**
 * Resend Email Service
 * 
 * Handles transactional emails via Resend API
 */

import { Resend } from 'resend';

// Memoized Resend client to avoid creating new instances on every call
let resendClient: Resend | null = null;

// Lazy initialize Resend client to avoid errors during build
function getResendClient(): Resend | null {
  if (!process.env['RESEND_API_KEY']) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env['RESEND_API_KEY']);
  }
  return resendClient;
}

export interface RfqNotificationEmailData {
  supplierName: string;
  supplierEmail: string;
  projectName: string;
  materialType: string;
  quantity?: number;
  unit?: string;
  budgetRange?: string;
  deliveryDeadline?: string;
  location: string;
  message?: string;
  rfqId: string;
  architectName?: string;
  companyName?: string;
}

/**
 * Send RFQ notification email to a supplier
 */
export async function sendRfqNotificationEmail(
  data: RfqNotificationEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResendClient();
    
    // For development/testing without API key
    if (!resend) {
      console.log('[DEV] RFQ notification email would be sent:', {
        to: data.supplierEmail,
        projectName: data.projectName,
        rfqId: data.rfqId,
      });
      return { success: true, messageId: 'dev-' + Date.now() };
    }

    const rfqUrl = `${process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3001'}/rfq/${data.rfqId}`;

    // Build quantity string
    const quantityStr = data.quantity && data.unit 
      ? `${data.quantity} ${data.unit}` 
      : 'Not specified';

    // Build deadline string
    const deadlineStr = data.deliveryDeadline 
      ? new Date(data.deliveryDeadline).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Not specified';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New RFQ Match: ${data.projectName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌱 New RFQ Match</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${data.supplierName},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Great news! You've been matched with a new Request for Quote (RFQ) on GreenChainz that matches your product offerings.
    </p>
    
    <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">Project Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Project Name:</td>
          <td style="padding: 8px 0;">${data.projectName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Material Type:</td>
          <td style="padding: 8px 0;">${data.materialType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Quantity:</td>
          <td style="padding: 8px 0;">${quantityStr}</td>
        </tr>
        ${data.budgetRange ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Budget Range:</td>
          <td style="padding: 8px 0;">${data.budgetRange}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Delivery Deadline:</td>
          <td style="padding: 8px 0;">${deadlineStr}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Location:</td>
          <td style="padding: 8px 0;">${data.location}</td>
        </tr>
        ${data.architectName ? `
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Architect:</td>
          <td style="padding: 8px 0;">${data.architectName}${data.companyName ? ` (${data.companyName})` : ''}</td>
        </tr>
        ` : ''}
      </table>
      
      ${data.message ? `
      <div style="margin-top: 20px;">
        <p style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Additional Requirements:</p>
        <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 0;">${data.message}</p>
      </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${rfqUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View RFQ Details
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      This RFQ was matched to your company based on your product offerings and capabilities. 
      Click the button above to view full details and submit your quote.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
      Best regards,<br>
      <strong>The GreenChainz Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 5px 0;">
      © ${new Date().getFullYear()} GreenChainz. All rights reserved.
    </p>
    <p style="margin: 5px 0;">
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3001'}/terms" style="color: #9ca3af; text-decoration: none;">Terms</a> · 
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3001'}/privacy" style="color: #9ca3af; text-decoration: none;">Privacy</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    const result = await resend.emails.send({
      from: process.env['RESEND_FROM_EMAIL'] || 'noreply@greenchainz.com',
      to: data.supplierEmail,
      subject: `New RFQ Match: ${data.projectName}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { 
        success: false, 
        error: result.error.message || 'Failed to send email' 
      };
    }

    return { 
      success: true, 
      messageId: result.data?.id 
    };

  } catch (error) {
    console.error('Failed to send RFQ notification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
