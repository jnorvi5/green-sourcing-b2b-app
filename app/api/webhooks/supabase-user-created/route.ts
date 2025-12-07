/**
 * Supabase Auth Webhook Handler for New User Sign-ups
 *
 * This webhook is triggered by Supabase Auth when a new user is created.
 * It sends role-specific welcome emails via Resend and schedules follow-up emails.
 *
 * Webhook URL: /api/webhooks/supabase-user-created
 * Method: POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail, sendBatchEmails } from '@/lib/email/resend-client';
import {
  generateSupplierWelcomeEmail,
  generateArchitectWelcomeEmail,
  generateSupplierFollowUpDay2Email,
  generateSupplierFollowUpDay7Email,
} from '@/lib/email/templates';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// =============================================================================
// Types and Validation
// =============================================================================

/**
 * Schema for Supabase Auth webhook payload
 * Based on: https://supabase.com/docs/guides/auth/auth-hooks
 */
const SupabaseAuthWebhookSchema = z.object({
  type: z.string(),
  table: z.string(),
  record: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    raw_user_meta_data: z
      .object({
        role: z.enum(['supplier', 'architect', 'buyer', 'admin']).optional(),
        full_name: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough(),
  }),
  schema: z.string(),
  old_record: z.unknown().optional(),
});

type SupabaseAuthWebhook = z.infer<typeof SupabaseAuthWebhookSchema>;

/**
 * User role type extracted from webhook payload
 */
type UserRole = 'supplier' | 'architect' | 'buyer' | 'admin';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extracts user name from metadata, falling back to email
 */
function getUserName(record: SupabaseAuthWebhook['record']): string {
  const metadata = record.raw_user_meta_data;
  return metadata.full_name || metadata.name || record.email.split('@')[0] || 'there';
}

/**
 * Gets the user role, defaulting to 'buyer' if not specified
 */
function getUserRole(record: SupabaseAuthWebhook['record']): UserRole {
  const role = record.raw_user_meta_data.role;
  // Default to buyer if role is not specified (architect is the same as buyer)
  return role || 'buyer';
}

/**
 * Generates dashboard URL based on user role
 */
function getDashboardUrl(role: UserRole): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://greenchainz.com';

  switch (role) {
    case 'supplier':
      return `${baseUrl}/supplier/dashboard`;
    case 'architect':
    case 'buyer':
      return `${baseUrl}/architect/dashboard`;
    case 'admin':
      return `${baseUrl}/admin/dashboard`;
    default:
      return `${baseUrl}/dashboard`;
  }
}

/**
 * Calculates a future date for scheduled emails
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// =============================================================================
// Email Sending Logic
// =============================================================================

/**
 * Sends welcome email for supplier role with scheduled follow-ups
 */
async function handleSupplierSignup(userId: string, email: string, name: string): Promise<void> {
  const dashboardUrl = getDashboardUrl('supplier');
  const now = new Date();

  console.log(`📧 Sending supplier welcome sequence to: ${email}`);

  // Send immediate welcome email
  const welcomeResult = await sendEmail({
    to: email,
    subject: 'Welcome to GreenChainz - Complete Your Profile',
    html: generateSupplierWelcomeEmail({ name, dashboardUrl }),
    tags: [
      { name: 'user_id', value: userId },
      { name: 'email_type', value: 'supplier_welcome' },
    ],
  });

  if (!welcomeResult.success) {
    console.error(`Failed to send welcome email to ${email}:`, welcomeResult.error);
    throw new Error(`Failed to send welcome email: ${welcomeResult.error}`);
  }

  console.log(`✅ Supplier welcome email sent: ${welcomeResult.messageId}`);

  // Schedule follow-up emails
  const followUpResults = await sendBatchEmails([
    {
      to: email,
      subject: "Don't forget to upload your certifications",
      html: generateSupplierFollowUpDay2Email({ name, dashboardUrl }),
      scheduledAt: addDays(now, 2),
      tags: [
        { name: 'user_id', value: userId },
        { name: 'email_type', value: 'supplier_followup_day2' },
      ],
    },
    {
      to: email,
      subject: 'Tips for getting your first RFQ match',
      html: generateSupplierFollowUpDay7Email({ name, dashboardUrl }),
      scheduledAt: addDays(now, 7),
      tags: [
        { name: 'user_id', value: userId },
        { name: 'email_type', value: 'supplier_followup_day7' },
      ],
    },
  ]);

  // Log follow-up results
  followUpResults.forEach((result, index) => {
    if (result.success) {
      const day = index === 0 ? 2 : 7;
      console.log(`✅ Supplier follow-up (Day ${day}) scheduled: ${result.messageId}`);
    } else {
      console.error(`Failed to schedule follow-up email ${index + 1}:`, result.error);
    }
  });

  // Check if any follow-ups failed
  const failedFollowUps = followUpResults.filter((r) => !r.success);
  if (failedFollowUps.length > 0) {
    console.warn(`${failedFollowUps.length} follow-up emails failed to schedule`);
  }
}

/**
 * Sends welcome email for architect/buyer role
 */
async function handleArchitectSignup(userId: string, email: string, name: string): Promise<void> {
  const createRfqUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://greenchainz.com'}/search`;

  console.log(`📧 Sending architect welcome email to: ${email}`);

  const result = await sendEmail({
    to: email,
    subject: 'Welcome to GreenChainz - Find Verified Sustainable Suppliers',
    html: generateArchitectWelcomeEmail({ name, createRfqUrl }),
    tags: [
      { name: 'user_id', value: userId },
      { name: 'email_type', value: 'architect_welcome' },
    ],
  });

  if (!result.success) {
    console.error(`Failed to send welcome email to ${email}:`, result.error);
    throw new Error(`Failed to send welcome email: ${result.error}`);
  }

  console.log(`✅ Architect welcome email sent: ${result.messageId}`);
}

// =============================================================================
// Webhook Handler
// =============================================================================

/**
 * POST handler for Supabase auth webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();

    console.log('📥 Received Supabase webhook:', {
      type: body.type,
      table: body.table,
      userId: body.record?.id,
    });

    // Validate webhook payload
    const validation = SupabaseAuthWebhookSchema.safeParse(body);

    if (!validation.success) {
      console.error('Invalid webhook payload:', validation.error.flatten());
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const webhook = validation.data;
    const { record } = webhook;

    // Extract user information
    const userId = record.id;
    const email = record.email;
    const name = getUserName(record);
    const role = getUserRole(record);

    console.log(`Processing new user signup:`, {
      userId,
      email,
      name,
      role,
    });

    // Send role-specific welcome emails
    if (role === 'supplier') {
      await handleSupplierSignup(userId, email, name);
    } else if (role === 'architect' || role === 'buyer') {
      await handleArchitectSignup(userId, email, name);
    } else {
      console.log(`No welcome email configured for role: ${role}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        userId,
        email,
        role,
        duration,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Webhook processing error:', {
      error: errorMessage,
      duration,
    });

    // Return 500 for processing errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: errorMessage,
        duration,
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Health Check (GET)
// =============================================================================

/**
 * GET handler for webhook health check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      webhook: 'supabase-user-created',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
