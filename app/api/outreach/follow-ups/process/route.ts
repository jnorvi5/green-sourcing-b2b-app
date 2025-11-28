/**
 * Process Follow-ups API
 * 
 * POST /api/outreach/follow-ups/process
 * Processes pending follow-ups - generates and optionally sends emails.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../../models/Lead';
import { generateOutreachEmail } from '../../../../../lib/azure-ai';
import { sendEmail } from '../../../../../lib/zoho-smtp';
import {
  ProcessFollowUpsRequest,
  ProcessFollowUpsResponse,
  EmailType,
  EmailStatus,
  EmailTone,
} from '../../../../../types/outreach';

export const dynamic = 'force-dynamic';

const MAX_FOLLOW_UPS = parseInt(process.env.OUTREACH_MAX_FOLLOW_UPS || '3', 10);
const DEFAULT_FOLLOW_UP_DAYS = parseInt(process.env.OUTREACH_AUTO_FOLLOW_UP_DAYS || '5', 10);

function getNextEmailType(followUpCount: number): EmailType {
  switch (followUpCount) {
    case 0:
      return EmailType.INITIAL;
    case 1:
      return EmailType.FOLLOW_UP_1;
    case 2:
      return EmailType.FOLLOW_UP_2;
    case 3:
      return EmailType.FOLLOW_UP_3;
    default:
      return EmailType.FOLLOW_UP_3;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ProcessFollowUpsResponse>> {
  const errors: string[] = [];
  let processed = 0;
  let sent = 0;
  let drafted = 0;

  try {
    const body = await request.json() as ProcessFollowUpsRequest;
    const autoSend = body.autoSend ?? false;
    const limit = Math.min(body.limit || 20, 50);

    const Lead = await getLeadModel();
    const now = new Date();

    // Find leads due for follow-up
    const leads = await Lead.find({
      autoFollowUpEnabled: true,
      nextFollowUpAt: { $lte: now },
      followUpCount: { $lt: MAX_FOLLOW_UPS + 1 },
      status: { $nin: ['converted', 'cold', 'responded', 'meeting_scheduled'] },
    })
      .sort({ nextFollowUpAt: 1 })
      .limit(limit);

    for (const lead of leads) {
      try {
        const emailType = getNextEmailType(lead.followUpCount || 0);

        // Generate email
        const generatedEmail = await generateOutreachEmail({
          lead: {
            companyName: lead.companyName,
            contactName: lead.contactName,
            role: lead.role,
            leadType: lead.leadType,
            context: lead.context || {},
          },
          emailType,
          tone: EmailTone.FRIENDLY,
        });

        // Add email to lead
        const newEmail = {
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          htmlBody: generatedEmail.htmlBody,
          generatedAt: new Date(),
          status: autoSend ? EmailStatus.APPROVED : EmailStatus.DRAFT,
          type: emailType,
        } as {
          subject: string;
          body: string;
          htmlBody: string;
          generatedAt: Date;
          status: EmailStatus;
          type: EmailType;
          sentAt?: Date;
          messageId?: string;
        };

        lead.emails.push(newEmail);

        // If autoSend is enabled, send the email
        if (autoSend) {
          const result = await sendEmail({
            to: lead.email,
            subject: generatedEmail.subject,
            text: generatedEmail.body,
            html: generatedEmail.htmlBody,
          });

          if (result.success) {
            const lastEmail = lead.emails[lead.emails.length - 1];
            if (lastEmail) {
              lastEmail.status = EmailStatus.SENT;
              lastEmail.sentAt = new Date();
              lastEmail.messageId = result.messageId;
            }
            lead.lastContactedAt = new Date();
            lead.followUpCount = (lead.followUpCount || 0) + 1;
            sent++;
          } else {
            const lastEmail = lead.emails[lead.emails.length - 1];
            if (lastEmail) {
              lastEmail.status = EmailStatus.DRAFT;
            }
            errors.push(`Failed to send to ${lead.email}: ${result.error}`);
            drafted++;
          }
        } else {
          drafted++;
        }

        // Schedule next follow-up
        if (lead.followUpCount < MAX_FOLLOW_UPS) {
          const nextFollowUp = new Date();
          nextFollowUp.setDate(nextFollowUp.getDate() + DEFAULT_FOLLOW_UP_DAYS);
          lead.nextFollowUpAt = nextFollowUp;
        } else {
          lead.nextFollowUpAt = undefined;
          lead.autoFollowUpEnabled = false;
        }

        await lead.save();
        processed++;

      } catch (leadError) {
        const errorMessage = leadError instanceof Error ? leadError.message : 'Unknown error';
        errors.push(`Error processing ${lead.email}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      sent,
      drafted,
      errors,
    });

  } catch (error) {
    console.error('Process follow-ups error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        processed, 
        sent, 
        drafted, 
        errors: [...errors, errorMessage] 
      },
      { status: 500 }
    );
  }
}
