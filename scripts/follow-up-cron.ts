/**
 * Follow-up Automation Script
 * 
 * Processes pending follow-ups for leads with auto-follow-up enabled.
 * Can be run via cron job or manually.
 * 
 * Usage:
 *   npx ts-node scripts/follow-up-cron.ts [--auto-send] [--limit=20]
 * 
 * Options:
 *   --auto-send    Automatically send emails (default: save as draft)
 *   --limit=N      Maximum number of leads to process (default: 20)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MAX_FOLLOW_UPS = parseInt(process.env.OUTREACH_MAX_FOLLOW_UPS || '3', 10);
const DEFAULT_FOLLOW_UP_DAYS = parseInt(process.env.OUTREACH_AUTO_FOLLOW_UP_DAYS || '5', 10);

// Parse command line arguments
const args = process.argv.slice(2);
const autoSend = args.includes('--auto-send');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1] || '20', 10) : 20;

// Email types
enum EmailType {
  INITIAL = 'initial',
  FOLLOW_UP_1 = 'follow_up_1',
  FOLLOW_UP_2 = 'follow_up_2',
  FOLLOW_UP_3 = 'follow_up_3',
}

enum EmailStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  SENT = 'sent',
}

enum EmailTone {
  FRIENDLY = 'friendly',
}

function getNextEmailType(followUpCount: number): EmailType {
  switch (followUpCount) {
    case 0:
      return EmailType.INITIAL;
    case 1:
      return EmailType.FOLLOW_UP_1;
    case 2:
      return EmailType.FOLLOW_UP_2;
    default:
      return EmailType.FOLLOW_UP_3;
  }
}

async function main() {
  console.log('========================================');
  console.log('GreenChainz Follow-up Automation Script');
  console.log('========================================');
  console.log(`Mode: ${autoSend ? 'Auto-send enabled' : 'Draft mode'}`);
  console.log(`Limit: ${limit} leads`);
  console.log('');

  // Validate environment
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  // Check Azure AI credentials if auto-send is enabled
  if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_KEY) {
    console.error('❌ Azure OpenAI credentials not configured');
    console.error('   Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY');
    process.exit(1);
  }

  // Check Zoho SMTP if auto-send is enabled
  if (autoSend && (!process.env.ZOHO_SMTP_USER || !process.env.ZOHO_SMTP_PASS)) {
    console.error('❌ Zoho SMTP credentials not configured (required for --auto-send)');
    console.error('   Set ZOHO_SMTP_USER and ZOHO_SMTP_PASS');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Define Lead schema (inline for script)
    const LeadSchema = new mongoose.Schema({
      companyName: String,
      contactName: String,
      email: String,
      role: String,
      leadType: String,
      status: String,
      autoFollowUpEnabled: Boolean,
      followUpCount: { type: Number, default: 0 },
      lastContactedAt: Date,
      nextFollowUpAt: Date,
      context: {
        companyDescription: String,
        certifications: [String],
        recentNews: String,
        customHook: String,
      },
      emails: [{
        subject: String,
        body: String,
        htmlBody: String,
        generatedAt: Date,
        sentAt: Date,
        status: String,
        type: String,
        messageId: String,
      }],
    }, { timestamps: true });

    const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

    const now = new Date();

    // Find leads due for follow-up
    console.log('🔍 Finding leads due for follow-up...');
    const leads = await Lead.find({
      autoFollowUpEnabled: true,
      nextFollowUpAt: { $lte: now },
      followUpCount: { $lt: MAX_FOLLOW_UPS + 1 },
      status: { $nin: ['converted', 'cold', 'responded', 'meeting_scheduled'] },
    })
      .sort({ nextFollowUpAt: 1 })
      .limit(limit);

    console.log(`📋 Found ${leads.length} leads to process`);
    console.log('');

    if (leads.length === 0) {
      console.log('✅ No follow-ups needed at this time');
      await mongoose.disconnect();
      process.exit(0);
    }

    let processed = 0;
    let sent = 0;
    let drafted = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      console.log(`\n📧 Processing: ${lead.companyName} (${lead.email})`);
      
      try {
        const emailType = getNextEmailType(lead.followUpCount || 0);
        console.log(`   Type: ${emailType}`);

        // Generate email using Azure AI
        console.log('   🤖 Generating email with AI...');
        const generatedEmail = await generateEmail({
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

        // Create email record
        const newEmail = {
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          htmlBody: generatedEmail.htmlBody,
          generatedAt: new Date(),
          status: autoSend ? EmailStatus.APPROVED : EmailStatus.DRAFT,
          type: emailType,
          sentAt: undefined as Date | undefined,
          messageId: undefined as string | undefined,
        };

        lead.emails.push(newEmail);

        if (autoSend) {
          // Send email via SMTP
          console.log('   📤 Sending email...');
          const result = await sendEmail({
            to: lead.email,
            subject: generatedEmail.subject,
            text: generatedEmail.body,
            html: generatedEmail.htmlBody,
          });

          if (result.success) {
            const lastEmail = lead.emails[lead.emails.length - 1];
            lastEmail.status = EmailStatus.SENT;
            lastEmail.sentAt = new Date();
            lastEmail.messageId = result.messageId;
            lead.lastContactedAt = new Date();
            lead.followUpCount = (lead.followUpCount || 0) + 1;
            sent++;
            console.log('   ✅ Email sent successfully');
          } else {
            const lastEmail = lead.emails[lead.emails.length - 1];
            lastEmail.status = EmailStatus.DRAFT;
            errors.push(`Failed to send to ${lead.email}: ${result.error}`);
            drafted++;
            console.log(`   ❌ Failed to send: ${result.error}`);
          }
        } else {
          drafted++;
          console.log('   ✅ Email saved as draft');
        }

        // Schedule next follow-up
        if (lead.followUpCount < MAX_FOLLOW_UPS) {
          const nextFollowUp = new Date();
          nextFollowUp.setDate(nextFollowUp.getDate() + DEFAULT_FOLLOW_UP_DAYS);
          lead.nextFollowUpAt = nextFollowUp;
          console.log(`   📅 Next follow-up: ${nextFollowUp.toLocaleDateString()}`);
        } else {
          lead.nextFollowUpAt = undefined;
          lead.autoFollowUpEnabled = false;
          console.log('   🏁 Max follow-ups reached, disabling auto-follow-up');
        }

        await lead.save();
        processed++;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Error processing ${lead.email}: ${errorMessage}`);
        console.log(`   ❌ Error: ${errorMessage}`);
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('Summary');
    console.log('========================================');
    console.log(`Processed: ${processed}`);
    console.log(`Sent: ${sent}`);
    console.log(`Drafted: ${drafted}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    console.log('\n✅ Script completed');

    await mongoose.disconnect();
    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Azure AI email generation (simplified version for script)
interface EmailGenerationRequest {
  lead: {
    companyName: string;
    contactName: string;
    role: string;
    leadType: string;
    context: {
      companyDescription?: string;
      certifications?: string[];
      recentNews?: string;
      customHook?: string;
    };
  };
  emailType: EmailType;
  tone: EmailTone;
}

interface GeneratedEmail {
  subject: string;
  body: string;
  htmlBody: string;
}

async function generateEmail(request: EmailGenerationRequest): Promise<GeneratedEmail> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'emailer';

  const systemPrompt = `You are a professional B2B outreach specialist for GreenChainz, a platform for verified sustainable building materials. Generate personalized outreach emails.`;

  const userPrompt = `Generate an outreach email:
Company: ${request.lead.companyName}
Contact: ${request.lead.contactName}
Role: ${request.lead.role}
Type: ${request.lead.leadType}
Email Type: ${request.emailType}
${request.lead.context.companyDescription ? `Context: ${request.lead.context.companyDescription}` : ''}
${request.lead.context.customHook ? `Hook: ${request.lead.context.customHook}` : ''}

Return JSON: { "subject": "...", "body": "...", "htmlBody": "..." }`;

  const response = await fetch(
    `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key || '',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content from Azure OpenAI');
  }

  return JSON.parse(content) as GeneratedEmail;
}

// Zoho SMTP email sending (simplified version for script)
import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const transporter = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.ZOHO_SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.ZOHO_SMTP_USER,
      pass: process.env.ZOHO_SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.ZOHO_FROM_NAME || 'GreenChainz'}" <${process.env.ZOHO_FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Run the script
main();
