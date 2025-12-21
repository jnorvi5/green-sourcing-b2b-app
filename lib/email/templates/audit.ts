/**
 * Audit Report Email Templates
 *
 * Email templates for carbon audit reports.
 */

import { EmailRecipient } from '../types';

// =============================================================================
// Shared Styles (copied from general.ts for consistency)
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
  buttonBlock: `display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;`,
  link: `color: #10b981; text-decoration: none;`,
  footer: `text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;`,
} as const;

// =============================================================================
// Helper: Wrap Template
// =============================================================================

function wrapTemplate(content: string): string {
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
      <span style="color: #ffffff; font-size: 20px; font-weight: bold;">GreenChainz</span>
      <div style="margin-top: 8px;">
        <span style="color: #a7f3d0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Carbon Audit Report
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
        <a href="https://greenchainz.com/support" style="${STYLES.link}">Contact Support</a>
      </p>
      <p style="margin: 0;">
        © ${currentYear} GreenChainz. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// =============================================================================
// Types
// =============================================================================

export interface AuditCompleteEmailData {
  userName: string;
  projectName: string;
  reportUrl: string;
  totalCarbon?: number; // kg CO2e
  score?: string; // e.g. "A", "B", "Gold"
}

// =============================================================================
// Templates
// =============================================================================

/**
 * Generates email for completed carbon audit report.
 */
export function generateAuditCompleteEmail(data: AuditCompleteEmailData): string {
  const content = `
    <h1 style="${STYLES.h1}">
      Audit Complete: ${data.projectName}
    </h1>

    <p style="${STYLES.text}">
      Hi ${data.userName},
    </p>

    <p style="${STYLES.text}">
      The carbon audit for your project <strong>${data.projectName}</strong> has been completed. You can now view and download the full report.
    </p>

    <!-- Summary Card -->
    <div style="${STYLES.card}">
      <h2 style="${STYLES.h2}">Audit Summary</h2>
      ${
        data.totalCarbon !== undefined
          ? `<p style="${STYLES.text}">Total Embodied Carbon: <strong style="color: #ffffff;">${data.totalCarbon.toLocaleString()} kg CO₂e</strong></p>`
          : ''
      }
      ${
        data.score
          ? `<p style="${STYLES.text}">Sustainability Score: <strong style="color: #10b981;">${data.score}</strong></p>`
          : ''
      }
      <p style="${STYLES.textSmall}">
        The report contains detailed breakdowns of material impact, transportation emissions, and recommendations for reduction.
      </p>
    </div>

    <a href="${data.reportUrl}" style="${STYLES.buttonBlock}">
      View Full Report →
    </a>

    <div style="margin-top: 24px;">
      <p style="${STYLES.textSmall}">
        If you have questions about the findings, you can discuss them with your sustainability consultant via the platform.
      </p>
    </div>
  `;

  return wrapTemplate(content);
}
