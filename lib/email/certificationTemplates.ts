/**
 * Email Templates for Certification Verification
 * Uses Teal brand color (#14b8a6) and HTML escaping for security
 */

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Email template for successful certification verification
 */
export function certificationVerifiedEmail(
  supplierName: string,
  companyName: string,
  certType: string
): string {
  const safeName = escapeHtml(supplierName);
  const safeCompany = escapeHtml(companyName);
  const safeCertType = escapeHtml(certType);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certification Verified - GreenChainz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <!-- Header with gradient -->
  <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✓ Certification Verified!</h1>
  </div>
  
  <!-- Main content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${safeName},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.8;">
      Great news! Your certification has been successfully verified by our team. Your company profile on GreenChainz is now showing as a verified supplier.
    </p>
    
    <!-- Certification details card -->
    <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #14b8a6; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #0d9488; font-size: 18px; margin-bottom: 15px;">Verified Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #374151;">Company:</td>
          <td style="padding: 8px 0; color: #111827;">${safeCompany}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #374151;">Certification Type:</td>
          <td style="padding: 8px 0; color: #111827;">${safeCertType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #374151;">Status:</td>
          <td style="padding: 8px 0;">
            <span style="background: #14b8a6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">Verified ✓</span>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- What's next section -->
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; color: #111827; font-size: 16px; margin-bottom: 12px;">What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;">Your verified badge will appear on your company profile</li>
        <li style="margin-bottom: 8px;">You'll gain increased visibility to buyers seeking verified suppliers</li>
        <li style="margin-bottom: 8px;">You can now access premium features and RFQ matching</li>
      </ul>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/supplier/dashboard" 
         style="display: inline-block; background: #14b8a6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);">
        View Your Dashboard
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
      Thank you for being part of the GreenChainz community of verified sustainable suppliers. 
      If you have any questions, please don't hesitate to reach out to our support team.
    </p>
    
    <p style="font-size: 14px; color: #374151; margin-top: 20px;">
      Best regards,<br>
      <strong style="color: #14b8a6;">The GreenChainz Team</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 5px 0;">
      © ${new Date().getFullYear()} GreenChainz. All rights reserved.
    </p>
    <p style="margin: 5px 0;">
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/terms" style="color: #9ca3af; text-decoration: none;">Terms</a> · 
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/privacy" style="color: #9ca3af; text-decoration: none;">Privacy</a>
    </p>
  </div>
  
</body>
</html>
  `.trim();
}

/**
 * Email template for certification rejection
 */
export function certificationRejectedEmail(
  supplierName: string,
  companyName: string,
  certType: string,
  reason: string
): string {
  const safeName = escapeHtml(supplierName);
  const safeCompany = escapeHtml(companyName);
  const safeCertType = escapeHtml(certType);
  const safeReason = escapeHtml(reason);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certification Review - GreenChainz</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Certification Review Required</h1>
  </div>
  
  <!-- Main content -->
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${safeName},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 25px; line-height: 1.8;">
      Thank you for submitting your certification for verification on GreenChainz. 
      After reviewing your submission, we need you to re-upload your certification document.
    </p>
    
    <!-- Details card -->
    <div style="background: #fef2f2; padding: 25px; border-radius: 8px; border-left: 4px solid #f87171; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #dc2626; font-size: 18px; margin-bottom: 15px;">Submission Details</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #374151;">Company:</td>
          <td style="padding: 8px 0; color: #111827;">${safeCompany}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #374151;">Certification Type:</td>
          <td style="padding: 8px 0; color: #111827;">${safeCertType}</td>
        </tr>
      </table>
      
      <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <p style="font-weight: 600; color: #374151; margin: 0 0 8px 0; font-size: 14px;">Admin Notes:</p>
        <p style="margin: 0; color: #111827; line-height: 1.6;">${safeReason}</p>
      </div>
    </div>
    
    <!-- What to do section -->
    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 3px solid #f59e0b;">
      <h3 style="margin-top: 0; color: #92400e; font-size: 16px; margin-bottom: 12px;">📋 Next Steps:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #78350f;">
        <li style="margin-bottom: 8px;">Review the admin notes above carefully</li>
        <li style="margin-bottom: 8px;">Prepare an updated certification document that addresses the feedback</li>
        <li style="margin-bottom: 8px;">Upload the new certification through your supplier dashboard</li>
        <li style="margin-bottom: 8px;">We'll review your resubmission within 1-2 business days</li>
      </ol>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/supplier/dashboard" 
         style="display: inline-block; background: #14b8a6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);">
        Re-upload Certification
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; line-height: 1.6;">
      We're committed to maintaining high standards for verified suppliers on GreenChainz. 
      If you have questions about this review or need assistance, please contact our support team.
    </p>
    
    <p style="font-size: 14px; color: #374151; margin-top: 20px;">
      Best regards,<br>
      <strong style="color: #14b8a6;">The GreenChainz Team</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 5px 0;">
      © ${new Date().getFullYear()} GreenChainz. All rights reserved.
    </p>
    <p style="margin: 5px 0;">
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/terms" style="color: #9ca3af; text-decoration: none;">Terms</a> · 
      <a href="${process.env['NEXT_PUBLIC_BASE_URL'] || 'https://greenchainz.com'}/privacy" style="color: #9ca3af; text-decoration: none;">Privacy</a>
    </p>
  </div>
  
</body>
</html>
  `.trim();
}
