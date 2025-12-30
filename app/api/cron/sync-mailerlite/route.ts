/**
 * MailerLite Sync Cron Job
 *
 * Daily cron job to sync Supabase users to MailerLite groups.
 * Auto-segments users by role and activity level.
 *
 * Schedule: Runs daily at 3:00 AM UTC
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMailerLiteClient } from '../../../../lib/email/mailerlite-client';
import { MAILERLITE_GROUPS } from '../../../../lib/email/types';

// =============================================================================
// Configuration
// =============================================================================

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

// Activity threshold: users who signed in within 30 days are "active"
const ACTIVE_DAYS_THRESHOLD = 30;

// Batch size for processing users
const BATCH_SIZE = 100;

// =============================================================================
// Types
// =============================================================================

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'buyer' | 'supplier' | 'admin';
  company_name: string | null;
  email_preferences: {
    marketing_emails?: boolean;
    newsletter_weekly?: boolean;
    newsletter_monthly?: boolean;
  } | null;
  mailerlite_subscriber_id: string | null;
  last_login_at: string | null;
  created_at: string;
  onboarding_completed: boolean;
}

interface SupplierInfo {
  user_id: string;
  verification_status: 'pending' | 'in_review' | 'verified' | 'rejected';
}

interface SyncStats {
  usersProcessed: number;
  usersAdded: number;
  usersUpdated: number;
  usersRemoved: number;
  errorsCount: number;
  architectsActive: number;
  architectsInactive: number;
  architectsTrial: number;
  suppliersVerified: number;
  suppliersPending: number;
  suppliersRejected: number;
  admins: number;
  errors: Array<{ email: string; error: string }>;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determines the groups a user should belong to based on their profile.
 */
function determineUserGroups(
  profile: UserProfile,
  supplierInfo: SupplierInfo | null,
  isActive: boolean
): string[] {
  const groups: string[] = [];

  // Add role-specific groups
  if (profile.role === 'admin') {
    groups.push(MAILERLITE_GROUPS.ADMINS);
  } else if (profile.role === 'supplier') {
    // Supplier segmentation based on verification status
    if (supplierInfo) {
      switch (supplierInfo.verification_status) {
        case 'verified':
          groups.push(MAILERLITE_GROUPS.SUPPLIERS_VERIFIED);
          break;
        case 'rejected':
          groups.push(MAILERLITE_GROUPS.SUPPLIERS_REJECTED);
          break;
        default:
          groups.push(MAILERLITE_GROUPS.SUPPLIERS_PENDING);
      }
    } else {
      groups.push(MAILERLITE_GROUPS.SUPPLIERS_PENDING);
    }
  } else {
    // Buyer/Architect segmentation
    if (!profile.onboarding_completed) {
      groups.push(MAILERLITE_GROUPS.ARCHITECTS_TRIAL);
    } else if (isActive) {
      groups.push(MAILERLITE_GROUPS.ARCHITECTS_ACTIVE);
    } else {
      groups.push(MAILERLITE_GROUPS.ARCHITECTS_INACTIVE);
    }
  }

  // Add newsletter groups based on preferences
  const prefs = profile.email_preferences;
  if (prefs?.newsletter_weekly !== false) {
    groups.push(MAILERLITE_GROUPS.NEWSLETTER_WEEKLY);
  }
  if (prefs?.newsletter_monthly !== false) {
    groups.push(MAILERLITE_GROUPS.NEWSLETTER_MONTHLY);
  }

  return groups;
}

/**
 * Checks if a user is considered "active" based on their last login.
 */
function isUserActive(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return false;

  const lastLogin = new Date(lastLoginAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - ACTIVE_DAYS_THRESHOLD);

  return lastLogin >= thirtyDaysAgo;
}

// =============================================================================
// Main Sync Function
// =============================================================================

async function syncUsersToMailerLite(): Promise<SyncStats> {
  const stats: SyncStats = {
    usersProcessed: 0,
    usersAdded: 0,
    usersUpdated: 0,
    usersRemoved: 0,
    errorsCount: 0,
    architectsActive: 0,
    architectsInactive: 0,
    architectsTrial: 0,
    suppliersVerified: 0,
    suppliersPending: 0,
    suppliersRejected: 0,
    admins: 0,
    errors: [],
  };

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const mailerLite = getMailerLiteClient();

  if (!mailerLite.isConfigured()) {
    console.log('[SYNC] MailerLite not configured, skipping sync');
    return stats;
  }

  // Get total count of users
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const totalUsers = count ?? 0;
  console.log(`[SYNC] Starting sync for ${totalUsers} users`);

  // Get supplier verification statuses
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('user_id, verification_status');

  const supplierMap = new Map<string, SupplierInfo>();
  if (suppliers) {
    for (const s of suppliers) {
      supplierMap.set(s.user_id, s as SupplierInfo);
    }
  }

  // Process users in batches
  let offset = 0;

  while (offset < totalUsers) {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('[SYNC] Error fetching users:', error);
      break;
    }

    if (!users || users.length === 0) break;

    for (const user of users as UserProfile[]) {
      const prefs = user.email_preferences;
      
      // Handle users who opted out of marketing emails
      if (prefs?.marketing_emails === false) {
        // If they were previously synced, remove them from MailerLite
        if (user.mailerlite_subscriber_id) {
          try {
            const deleteResult = await mailerLite.deleteSubscriber(user.email);
            if (deleteResult.success) {
              stats.usersRemoved++;
              // Clear the subscriber ID in the database
              await supabase
                .from('profiles')
                .update({
                  mailerlite_subscriber_id: null,
                  mailerlite_synced_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            }
          } catch (error) {
            stats.errorsCount++;
            stats.errors.push({
              email: user.email,
              error: `Failed to remove opted-out user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }
        stats.usersProcessed++;
        continue;
      }

      const isActive = isUserActive(user.last_login_at);
      const supplierInfo = supplierMap.get(user.id) ?? null;
      const groups = determineUserGroups(user, supplierInfo, isActive);

      // Update segment counts
      if (groups.includes(MAILERLITE_GROUPS.ARCHITECTS_ACTIVE)) stats.architectsActive++;
      if (groups.includes(MAILERLITE_GROUPS.ARCHITECTS_INACTIVE)) stats.architectsInactive++;
      if (groups.includes(MAILERLITE_GROUPS.ARCHITECTS_TRIAL)) stats.architectsTrial++;
      if (groups.includes(MAILERLITE_GROUPS.SUPPLIERS_VERIFIED)) stats.suppliersVerified++;
      if (groups.includes(MAILERLITE_GROUPS.SUPPLIERS_PENDING)) stats.suppliersPending++;
      if (groups.includes(MAILERLITE_GROUPS.SUPPLIERS_REJECTED)) stats.suppliersRejected++;
      if (groups.includes(MAILERLITE_GROUPS.ADMINS)) stats.admins++;

      // Sync to MailerLite
      try {
        const result = await mailerLite.upsertSubscriber({
          email: user.email,
          fields: {
            name: user.first_name ?? undefined,
            lastName: user.last_name ?? undefined,
            company: user.company_name ?? undefined,
          },
          groups,
        });

        if (result.success) {
          if (user.mailerlite_subscriber_id) {
            stats.usersUpdated++;
          } else {
            stats.usersAdded++;

            // Update the profile with the MailerLite subscriber ID
            if (result.subscriberId) {
              await supabase
                .from('profiles')
                .update({
                  mailerlite_subscriber_id: result.subscriberId,
                  mailerlite_synced_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            }
          }
        } else {
          stats.errorsCount++;
          stats.errors.push({
            email: user.email,
            error: result.error ?? 'Unknown error',
          });
        }
      } catch (error) {
        stats.errorsCount++;
        stats.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      stats.usersProcessed++;
    }

    offset += BATCH_SIZE;
    console.log(`[SYNC] Processed ${Math.min(offset, totalUsers)}/${totalUsers} users`);
  }

  return stats;
}

/**
 * Logs the sync results to the database.
 */
async function logSyncResults(
  stats: SyncStats,
  startTime: Date,
  status: 'completed' | 'failed'
): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const endTime = new Date();
  const durationMs = endTime.getTime() - startTime.getTime();

  try {
    await supabase.from('mailerlite_sync_log').insert({
      sync_type: 'full',
      users_processed: stats.usersProcessed,
      users_added: stats.usersAdded,
      users_updated: stats.usersUpdated,
      users_removed: stats.usersRemoved,
      errors_count: stats.errorsCount,
      architects_active: stats.architectsActive,
      architects_inactive: stats.architectsInactive,
      architects_trial: stats.architectsTrial,
      suppliers_verified: stats.suppliersVerified,
      suppliers_pending: stats.suppliersPending,
      suppliers_rejected: stats.suppliersRejected,
      admins: stats.admins,
      status,
      error_details: stats.errors,
      started_at: startTime.toISOString(),
      completed_at: endTime.toISOString(),
      duration_ms: durationMs,
    });
  } catch (error) {
    console.error('[SYNC] Failed to log sync results:', error);
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

export async function GET(request: Request): Promise<Response> {
  const startTime = new Date();

  // Verify the request is authorized (using CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env['CRON_SECRET'];

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[SYNC] Starting MailerLite sync cron job');

  try {
    const stats = await syncUsersToMailerLite();

    console.log('[SYNC] Sync completed:', {
      processed: stats.usersProcessed,
      added: stats.usersAdded,
      updated: stats.usersUpdated,
      errors: stats.errorsCount,
    });

    await logSyncResults(stats, startTime, 'completed');

    return NextResponse.json({
      success: true,
      message: 'MailerLite sync completed',
      stats: {
        usersProcessed: stats.usersProcessed,
        usersAdded: stats.usersAdded,
        usersUpdated: stats.usersUpdated,
        errorsCount: stats.errorsCount,
        segments: {
          architectsActive: stats.architectsActive,
          architectsInactive: stats.architectsInactive,
          architectsTrial: stats.architectsTrial,
          suppliersVerified: stats.suppliersVerified,
          suppliersPending: stats.suppliersPending,
          suppliersRejected: stats.suppliersRejected,
          admins: stats.admins,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SYNC] Sync failed:', errorMessage);

    await logSyncResults(
      {
        usersProcessed: 0,
        usersAdded: 0,
        usersUpdated: 0,
        usersRemoved: 0,
        errorsCount: 1,
        architectsActive: 0,
        architectsInactive: 0,
        architectsTrial: 0,
        suppliersVerified: 0,
        suppliersPending: 0,
        suppliersRejected: 0,
        admins: 0,
        errors: [{ email: 'system', error: errorMessage }],
      },
      startTime,
      'failed'
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Export for cron job scheduling
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time
