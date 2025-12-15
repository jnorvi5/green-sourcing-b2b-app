/**
 * Email Templates
 *
 * HTML email templates for transactional emails with GreenChainz branding.
 * Features a green gradient header and dark theme consistent with the platform.
 */

import type {
  RfqNotificationData,
  RfqConfirmationData,
  SupplierApprovalData,
  SupplierRejectionData,
  SupplierClaimData,
} from './types';

// =============================================================================
// Shared Styles
// =============================================================================

const STYLES = {
  body: `margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;`,
  container: `max-width: 600px; margin: 0 auto; padding: 40px 20px;`,
  header: `background: linear-gradient(135deg, #065f46, #10b981); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;`,
  logo: `height: 40px;`,
  content: `background-color: #1f2937; border-radius: 0 0 16px 16px; padding: 32px; border: 1px solid #374151; border-top: none;`,
  h1: `color: #ffffff; margin: 0 0 16px 0; font-size: 24px;`,
  h2: `color: #ffffff; margin: 0 0 12px 0; font-size: 18px;`,
  text: `color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;`,
  textSmall: `color: #9ca3af; font-size: 14px; line-height: 1.5;`,
  card: `background-color: #111827; border-radius: 12px; padding: 20px; margin-bottom: 24px;`,
  button: `display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;`,
  buttonBlock: `display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;`,
  badge: `display: inline-block; background-color: #065f46; color: #10b981; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;`,
  alertSuccess: `background-color: #065f46; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;`,
  alertWarning: `background-color: #7c2d12; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;`,
  alertInfo: `background-color: #1e3a5f; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;`,
  footer: `text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;`,
  link: `color: #10b981; text-decoration: none;`,
  tableRow: `color: #9ca3af; font-size: 14px; padding: 8px 0;`,
  tableValue: `color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;`,
} as const;

// =============================================================================
// Base Template Wrapper
// =============================================================================

function wrapTemplate(content: string, showHeaderLogo = true): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${STYLES.body}">
  <div style="${STYLES.container}">
    <!-- Header with Gradient -->
    <div style="${STYLES.header}">
      ${showHeaderLogo ? `<img src="https://greenchainz.com/logo-white.png" alt="GreenChainz" style="${STYLES.logo}" />` : ''}
      <div style="margin-top: 16px;">
        <span style="color: #a7f3d0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          B2B Green Sourcing Marketplace
        </span>
      </div>
    </div>
    
    <!-- Main Content -->
    <div style="${STYLES.content}">
      ${content}
    </div>

    <!-- Footer -->
    <div style="${STYLES.footer}">
      <p style="margin: 0 0 8px 0;">
        <a href="https://greenchainz.com/support" style="${STYLES.link}">Contact Support</a> |
        <a href="https://greenchainz.com/settings/notifications" style="${STYLES.link}">Email Preferences</a>
      </p>
      <p style="margin: 0;">
        © ${currentYear} GreenChainz. All rights reserved.
      </p>
      <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 12px;">
        Connecting sustainable suppliers with eco-conscious buyers.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// =============================================================================
// RFQ Notification Email (To Supplier)
// =============================================================================

export function generateRfqNotificationEmail(data: RfqNotificationData): string {
  const content = `
    <!-- Alert Banner -->
    <div style="${STYLES.alertSuccess}">
      <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">📬 NEW RFQ REQUEST</span>
    </div>

    <h1 style="${STYLES.h1}">
      Hi ${data.supplierName},
    </h1>
    
    <p style="${STYLES.text}">
      You've received a new quote request for <strong style="color: #10b981;">${data.productName}</strong>
    </p>

    <!-- RFQ Details Card -->
    <div style="${STYLES.card}">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #374151;">
        <span style="color: #9ca3af; font-size: 14px;">RFQ Number</span>
        <span style="color: #ffffff; font-weight: 600;">${data.rfqNumber}</span>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="${STYLES.tableRow}">Quantity</td>
          <td style="${STYLES.tableValue}">${data.quantity.toLocaleString()} ${data.unit}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Buyer</td>
          <td style="${STYLES.tableValue}">${data.buyerCompany}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Project</td>
          <td style="${STYLES.tableValue}">${data.projectName}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Delivery Location</td>
          <td style="${STYLES.tableValue}">${data.deliveryLocation}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Delivery Date</td>
          <td style="${STYLES.tableValue}">${data.deliveryDate}</td>
        </tr>
      </table>
    </div>

    <!-- Urgency Notice -->
    <div style="${STYLES.alertWarning}">
      <span style="color: #fed7aa; font-size: 14px;">⏰ Quote expires on <strong>${data.expiresAt}</strong></span>
    </div>

    <a href="${data.viewUrl}" style="${STYLES.buttonBlock}">
      View RFQ & Submit Quote →
    </a>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// RFQ Confirmation Email (To Buyer/Architect)
// =============================================================================

export function generateRfqConfirmationEmail(data: RfqConfirmationData): string {
  const content = `
    <!-- Alert Banner -->
    <div style="${STYLES.alertInfo}">
      <span style="color: #93c5fd; font-size: 14px; font-weight: 600;">✅ RFQ SUBMITTED</span>
    </div>

    <h1 style="${STYLES.h1}">
      Hi ${data.buyerName},
    </h1>
    
    <p style="${STYLES.text}">
      Your request for quote has been submitted successfully to <strong style="color: #10b981;">${data.supplierName}</strong>.
    </p>

    <!-- RFQ Details Card -->
    <div style="${STYLES.card}">
      <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #374151;">
        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase;">Product</span>
        <div style="color: #ffffff; font-size: 18px; font-weight: 600; margin-top: 4px;">${data.productName}</div>
        <div style="color: #6b7280; font-size: 14px;">${data.rfqNumber}</div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="${STYLES.tableRow}">Quantity</td>
          <td style="${STYLES.tableValue}">${data.quantity.toLocaleString()} ${data.unit}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Supplier</td>
          <td style="${STYLES.tableValue}">${data.supplierName}</td>
        </tr>
        <tr>
          <td style="${STYLES.tableRow}">Expected Response</td>
          <td style="${STYLES.tableValue}">${data.expectedResponseDate}</td>
        </tr>
      </table>
    </div>

    <p style="${STYLES.textSmall}">
      You'll receive an email notification when the supplier responds with a quote.
    </p>

    <a href="${data.viewUrl}" style="${STYLES.buttonBlock}">
      View RFQ Details →
    </a>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Approval Email
// =============================================================================

export function generateSupplierApprovalEmail(data: SupplierApprovalData): string {
  const nextSteps = data.nextSteps ?? [
    'Complete your company profile with logo and description',
    'Add your products with EPD documentation',
    'Set up your notification preferences',
    'Start receiving quote requests from architects',
  ];

  const content = `
    <!-- Success Banner -->
    <div style="${STYLES.alertSuccess}">
      <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">🎉 ACCOUNT APPROVED</span>
    </div>

    <h1 style="${STYLES.h1}">
      Congratulations, ${data.supplierName}! 🌱
    </h1>
    
    <p style="${STYLES.text}">
      Your GreenChainz supplier account for <strong style="color: #10b981;">${data.companyName}</strong> has been verified and approved.
    </p>

    <p style="${STYLES.text}">
      You now have full access to the GreenChainz marketplace where you can connect with eco-conscious architects and contractors looking for sustainable building materials.
    </p>

    <!-- Next Steps Card -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">🚀 Get Started</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        ${nextSteps.map((step) => `<li>${step}</li>`).join('')}
      </ul>
    </div>

    <a href="${data.dashboardUrl}" style="${STYLES.buttonBlock}">
      Go to Supplier Dashboard →
    </a>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Need help getting started? Check out our 
        <a href="https://greenchainz.com/docs/supplier-guide" style="${STYLES.link}">Supplier Guide</a>
        or <a href="https://greenchainz.com/support" style="${STYLES.link}">contact support</a>.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Rejection Email
// =============================================================================

export function generateSupplierRejectionEmail(data: SupplierRejectionData): string {
  const content = `
    <h1 style="${STYLES.h1}">
      Application Status Update
    </h1>
    
    <p style="${STYLES.text}">
      Hi ${data.supplierName},
    </p>

    <p style="${STYLES.text}">
      Thank you for your interest in joining the GreenChainz marketplace. After careful review, we were unable to approve your supplier application for <strong>${data.companyName}</strong> at this time.
    </p>

    <!-- Reason Card -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">Reason</h2>
      <p style="color: #d1d5db; margin: 0; line-height: 1.6;">
        ${data.reason}
      </p>
    </div>

    ${
      data.canReapply
        ? `
    <p style="${STYLES.text}">
      You're welcome to address these concerns and reapply in the future.
    </p>

    ${data.reapplyUrl ? `<a href="${data.reapplyUrl}" style="${STYLES.buttonBlock}">Submit New Application →</a>` : ''}
    `
        : ''
    }

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        If you have questions about this decision, please contact us at 
        <a href="mailto:${data.contactEmail}" style="${STYLES.link}">${data.contactEmail}</a>.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Account Verification Email
// =============================================================================

export function generateAccountVerificationEmail(data: {
  userName: string;
  verificationUrl: string;
}): string {
  const content = `
    <h1 style="${STYLES.h1}">
      Verify Your Email Address
    </h1>
    
    <p style="${STYLES.text}">
      Hi ${data.userName},
    </p>

    <p style="${STYLES.text}">
      Welcome to GreenChainz! Please verify your email address to complete your account setup.
    </p>

    <a href="${data.verificationUrl}" style="${STYLES.buttonBlock}">
      Verify Email Address →
    </a>

    <div style="${STYLES.card} margin-top: 24px;">
      <p style="${STYLES.textSmall} margin: 0;">
        <strong style="color: #ffffff;">Security Note:</strong> This link will expire in 24 hours.
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Can't click the button? Copy and paste this link into your browser:<br>
        <span style="color: #6b7280; word-break: break-all; font-size: 12px;">${data.verificationUrl}</span>
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Password Reset Email
// =============================================================================

export function generatePasswordResetEmail(data: {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}): string {
  const content = `
    <!-- Alert Banner -->
    <div style="${STYLES.alertInfo}">
      <span style="color: #93c5fd; font-size: 14px; font-weight: 600;">🔐 PASSWORD RESET</span>
    </div>

    <h1 style="${STYLES.h1}">
      Reset Your Password
    </h1>
    
    <p style="${STYLES.text}">
      Hi ${data.userName},
    </p>

    <p style="${STYLES.text}">
      We received a request to reset your GreenChainz password. Click the button below to create a new password.
    </p>

    <a href="${data.resetUrl}" style="${STYLES.buttonBlock}">
      Reset Password →
    </a>

    <div style="${STYLES.alertWarning} margin-top: 24px;">
      <span style="color: #fed7aa; font-size: 14px;">⏰ This link expires in ${data.expiresIn}</span>
    </div>

    <div style="${STYLES.card} margin-top: 24px;">
      <p style="${STYLES.textSmall} margin: 0;">
        <strong style="color: #ffffff;">Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email or 
        <a href="https://greenchainz.com/support" style="${STYLES.link}">contact support</a>
        if you're concerned about your account security.
      </p>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Can't click the button? Copy and paste this link into your browser:<br>
        <span style="color: #6b7280; word-break: break-all; font-size: 12px;">${data.resetUrl}</span>
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Welcome Email
// =============================================================================

export function generateSupplierWelcomeEmail(data: {
  name: string;
  dashboardUrl: string;
}): string {
  const content = `
    <!-- Welcome Banner -->
    <div style="${STYLES.alertSuccess}">
      <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">🎉 WELCOME TO GREENCHAINZ</span>
    </div>

    <h1 style="${STYLES.h1}">
      Welcome, ${data.name}! 🌱
    </h1>
    
    <p style="${STYLES.text}">
      Thank you for joining GreenChainz, the leading B2B marketplace connecting sustainable building material suppliers with eco-conscious architects and contractors.
    </p>

    <p style="${STYLES.text}">
      To start receiving quote requests and connecting with buyers, you'll need to complete your supplier profile.
    </p>

    <!-- Getting Started Steps -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">🚀 Get Verified in 3 Steps</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong style="color: #ffffff;">Upload Your Certifications</strong> - Add EPDs, FSC, LEED, or other sustainability certifications</li>
        <li><strong style="color: #ffffff;">Add Your Products</strong> - List your sustainable building materials with specifications</li>
        <li><strong style="color: #ffffff;">Get Verified</strong> - Our team will review and verify your account within 48 hours</li>
      </ul>
    </div>

    <a href="${data.dashboardUrl}" style="${STYLES.buttonBlock}">
      Complete Your Profile →
    </a>

    <div style="margin-top: 24px;">
      <p style="${STYLES.text}">
        <strong style="color: #ffffff;">Why Get Verified?</strong>
      </p>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
        <li>Stand out with a verified badge</li>
        <li>Receive more RFQ opportunities</li>
        <li>Build trust with architects and contractors</li>
        <li>Access premium marketplace features</li>
      </ul>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Need help? Check out our 
        <a href="https://greenchainz.com/docs/supplier-guide" style="${STYLES.link}">Supplier Guide</a>
        or <a href="https://greenchainz.com/support" style="${STYLES.link}">contact support</a>.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Architect Welcome Email
// =============================================================================

export function generateArchitectWelcomeEmail(data: {
  name: string;
  createRfqUrl: string;
}): string {
  const content = `
    <!-- Welcome Banner -->
    <div style="${STYLES.alertSuccess}">
      <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">🎉 WELCOME TO GREENCHAINZ</span>
    </div>

    <h1 style="${STYLES.h1}">
      Welcome, ${data.name}! 🏗️
    </h1>
    
    <p style="${STYLES.text}">
      Welcome to GreenChainz! You now have access to a curated network of <strong style="color: #10b981;">verified sustainable suppliers</strong> ready to provide materials for your next project.
    </p>

    <p style="${STYLES.text}">
      Finding green building materials has never been easier. Here's how it works:
    </p>

    <!-- How It Works -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">🔍 How to Find Suppliers</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong style="color: #ffffff;">Browse Products</strong> - Search our catalog of sustainable materials with EPD data</li>
        <li><strong style="color: #ffffff;">Create an RFQ</strong> - Send quote requests to verified suppliers</li>
        <li><strong style="color: #ffffff;">Compare Options</strong> - Evaluate quotes based on price, carbon footprint, and certifications</li>
        <li><strong style="color: #ffffff;">Close the Deal</strong> - Connect directly with suppliers to finalize your order</li>
      </ul>
    </div>

    <a href="${data.createRfqUrl}" style="${STYLES.buttonBlock}">
      Create Your First RFQ →
    </a>

    <div style="margin-top: 24px;">
      <p style="${STYLES.text}">
        <strong style="color: #ffffff;">Why Choose GreenChainz?</strong>
      </p>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
        <li>All suppliers are verified for sustainability credentials</li>
        <li>Access comprehensive EPD and carbon data for every product</li>
        <li>Compare materials based on environmental impact</li>
        <li>Streamline your green procurement process</li>
      </ul>
    </div>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Questions? Visit our 
        <a href="https://greenchainz.com/docs/buyer-guide" style="${STYLES.link}">Buyer Guide</a>
        or <a href="https://greenchainz.com/support" style="${STYLES.link}">reach out to support</a>.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Follow-up Email - Day 2
// =============================================================================

export function generateSupplierFollowUpDay2Email(data: {
  name: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h1 style="${STYLES.h1}">
      Don't forget to upload your certifications 📄
    </h1>
    
    <p style="${STYLES.text}">
      Hi ${data.name},
    </p>

    <p style="${STYLES.text}">
      We noticed you haven't uploaded your sustainability certifications yet. Adding your EPDs, FSC, LEED, or other green certifications is crucial for getting verified and attracting buyers.
    </p>

    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">✅ Why Certifications Matter</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Verified suppliers receive <strong style="color: #10b981;">3x more RFQ requests</strong></li>
        <li>Build trust and credibility with architects</li>
        <li>Stand out with a verified badge on your profile</li>
        <li>Get matched with high-value projects</li>
      </ul>
    </div>

    <a href="${data.dashboardUrl}" style="${STYLES.buttonBlock}">
      Upload Certifications Now →
    </a>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        Need help? Our team can assist with document formatting and verification.
        <a href="https://greenchainz.com/support" style="${STYLES.link}">Contact support</a>
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Follow-up Email - Day 7
// =============================================================================

export function generateSupplierFollowUpDay7Email(data: {
  name: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h1 style="${STYLES.h1}">
      Tips for getting your first RFQ match 🎯
    </h1>
    
    <p style="${STYLES.text}">
      Hi ${data.name},
    </p>

    <p style="${STYLES.text}">
      Ready to start receiving quote requests? Here are proven strategies to increase your visibility and win more business on GreenChainz.
    </p>

    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">🚀 Top Tips from Successful Suppliers</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong style="color: #ffffff;">Complete Your Profile</strong> - Add a logo, company description, and contact details</li>
        <li><strong style="color: #ffffff;">List Multiple Products</strong> - The more products you have, the more opportunities to match</li>
        <li><strong style="color: #ffffff;">Include Detailed Specs</strong> - Add technical specs, pricing tiers, and lead times</li>
        <li><strong style="color: #ffffff;">Upload EPD Data</strong> - Products with carbon data get 2x more views</li>
        <li><strong style="color: #ffffff;">Respond Quickly</strong> - Aim to respond to RFQs within 24 hours</li>
      </ul>
    </div>

    <a href="${data.dashboardUrl}" style="${STYLES.buttonBlock}">
      Optimize Your Profile →
    </a>

    <div style="margin-top: 24px;">
      <p style="${STYLES.text}">
        <strong style="color: #ffffff;">Need Personalized Advice?</strong>
      </p>
      <p style="${STYLES.textSmall}">
        Our team offers free onboarding consultations to help you maximize your success on the platform.
        <a href="https://greenchainz.com/suppliers/consultation" style="${STYLES.link}">Schedule a call</a>
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Supplier Claim Email
// =============================================================================

export function generateSupplierClaimEmail(data: SupplierClaimData): string {
  const content = `
    <!-- Alert Banner -->
    <div style="${STYLES.alertSuccess}">
      <span style="color: #6ee7b7; font-size: 14px; font-weight: 600;">👋 CLAIM YOUR PROFILE</span>
    </div>

    <h1 style="${STYLES.h1}">
      Is ${data.companyName} on GreenChainz?
    </h1>

    <p style="${STYLES.text}">
      We've listed <strong>${data.companyName}</strong> on GreenChainz, the leading marketplace for sustainable building materials.
    </p>

    <p style="${STYLES.text}">
      Architects and contractors are already searching for verified green suppliers. Claim your free profile to start receiving quote requests today.
    </p>

    <!-- Benefits Card -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">✨ Why Claim Your Profile?</h2>
      <ul style="color: #9ca3af; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li><strong style="color: #ffffff;">Get Verified</strong> - Build trust with verified sustainability data</li>
        <li><strong style="color: #ffffff;">Receive RFQs</strong> - Get quote requests directly from buyers</li>
        <li><strong style="color: #ffffff;">Showcase Products</strong> - Display your full catalog with EPDs</li>
      </ul>
    </div>

    <a href="${data.claimUrl}" style="${STYLES.buttonBlock}">
      Claim My Profile Now →
    </a>

    <div style="margin-top: 24px; text-align: center;">
      <p style="${STYLES.textSmall}">
        If you are not the right person to manage this profile, please forward this email to the appropriate contact.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}

// =============================================================================
// Export All Templates
// =============================================================================

const emailTemplates = {
  generateRfqNotificationEmail,
  generateRfqConfirmationEmail,
  generateSupplierApprovalEmail,
  generateSupplierRejectionEmail,
  generateAccountVerificationEmail,
  generatePasswordResetEmail,
  generateSupplierWelcomeEmail,
  generateArchitectWelcomeEmail,
  generateSupplierFollowUpDay2Email,
  generateSupplierFollowUpDay7Email,
  generateSupplierClaimEmail,
};

export default emailTemplates;
