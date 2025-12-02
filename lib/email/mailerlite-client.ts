/**
 * MailerLite Client
 *
 * Handles marketing emails, subscriber management, campaigns, and automations
 * via the MailerLite API.
 */

import { z } from 'zod';
import {
  MailerLiteApiResponseSchema,
  MailerLiteSubscriberSchema,
  MailerLiteGroupSchema,
  MAILERLITE_GROUPS,
  type MailerLiteSubscriber,
  type MailerLiteGroup,
  type MailerLiteApiResponse,
} from './types';

// =============================================================================
// Configuration
// =============================================================================

const MAILERLITE_CONFIG = {
  apiKey: process.env.MAILERLITE_API_KEY ?? '',
  baseUrl: 'https://connect.mailerlite.com/api',
  fromEmail: process.env.MAILERLITE_FROM_EMAIL ?? 'newsletter@greenchainz.com',
  fromName: process.env.MAILERLITE_FROM_NAME ?? 'GreenChainz',
} as const;

// Group ID mapping (these should be configured in MailerLite dashboard)
const GROUP_IDS: Record<string, string> = {
  [MAILERLITE_GROUPS.ARCHITECTS_ACTIVE]:
    process.env.MAILERLITE_GROUP_ARCHITECTS_ACTIVE ?? '',
  [MAILERLITE_GROUPS.ARCHITECTS_INACTIVE]:
    process.env.MAILERLITE_GROUP_ARCHITECTS_INACTIVE ?? '',
  [MAILERLITE_GROUPS.ARCHITECTS_TRIAL]:
    process.env.MAILERLITE_GROUP_ARCHITECTS_TRIAL ?? '',
  [MAILERLITE_GROUPS.SUPPLIERS_VERIFIED]:
    process.env.MAILERLITE_GROUP_SUPPLIERS_VERIFIED ?? '',
  [MAILERLITE_GROUPS.SUPPLIERS_PENDING]:
    process.env.MAILERLITE_GROUP_SUPPLIERS_PENDING ?? '',
  [MAILERLITE_GROUPS.SUPPLIERS_REJECTED]:
    process.env.MAILERLITE_GROUP_SUPPLIERS_REJECTED ?? '',
  [MAILERLITE_GROUPS.ADMINS]: process.env.MAILERLITE_GROUP_ADMINS ?? '',
  [MAILERLITE_GROUPS.NEWSLETTER_WEEKLY]:
    process.env.MAILERLITE_GROUP_NEWSLETTER_WEEKLY ?? '',
  [MAILERLITE_GROUPS.NEWSLETTER_MONTHLY]:
    process.env.MAILERLITE_GROUP_NEWSLETTER_MONTHLY ?? '',
};

// =============================================================================
// MailerLite Client Class
// =============================================================================

export class MailerLiteClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MAILERLITE_CONFIG.apiKey;
    this.baseUrl = MAILERLITE_CONFIG.baseUrl;
  }

  /**
   * Checks if the client is configured with an API key.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Makes an authenticated request to the MailerLite API.
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: Record<string, unknown>;
      schema?: z.ZodSchema<T>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, schema } = options;

    if (!this.isConfigured()) {
      throw new Error('MailerLite API key not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MailerLite API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (schema) {
      return schema.parse(data);
    }

    return data as T;
  }

  // ===========================================================================
  // Subscriber Management
  // ===========================================================================

  /**
   * Gets a subscriber by email.
   */
  public async getSubscriber(email: string): Promise<MailerLiteSubscriber | null> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would get subscriber:', email);
      return null;
    }

    try {
      const response = await this.request<MailerLiteApiResponse>(
        `/subscribers/${encodeURIComponent(email)}`,
        { schema: MailerLiteApiResponseSchema }
      );
      return MailerLiteSubscriberSchema.parse(response.data);
    } catch (error) {
      // Subscriber not found returns 404
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Creates or updates a subscriber.
   */
  public async upsertSubscriber(data: {
    email: string;
    fields?: {
      name?: string;
      lastName?: string;
      company?: string;
      phone?: string;
    };
    groups?: string[];
    status?: 'active' | 'unsubscribed' | 'unconfirmed';
  }): Promise<{ success: boolean; subscriberId?: string; action: string; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would upsert subscriber:', data);
      return { success: true, subscriberId: `dev-${Date.now()}`, action: 'created' };
    }

    try {
      // Map group names to IDs
      const groupIds = (data.groups ?? [])
        .map((groupName) => GROUP_IDS[groupName])
        .filter(Boolean);

      const response = await this.request<MailerLiteApiResponse>('/subscribers', {
        method: 'POST',
        body: {
          email: data.email,
          fields: {
            name: data.fields?.name,
            last_name: data.fields?.lastName,
            company: data.fields?.company,
            phone: data.fields?.phone,
          },
          groups: groupIds.length > 0 ? groupIds : undefined,
          status: data.status ?? 'active',
        },
        schema: MailerLiteApiResponseSchema,
      });

      const subscriber = MailerLiteSubscriberSchema.parse(response.data);
      return {
        success: true,
        subscriberId: subscriber.id,
        action: 'upserted',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to upsert subscriber:', errorMessage);
      return {
        success: false,
        action: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Removes a subscriber from MailerLite.
   */
  public async deleteSubscriber(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would delete subscriber:', email);
      return { success: true };
    }

    // Validate email format
    if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)) {
      return { success: false, error: 'Invalid email address' };
    }

    try {
      // First get the subscriber to get their ID
      const subscriber = await this.getSubscriber(email);
      if (!subscriber?.id) {
        return { success: true }; // Already doesn't exist
      }

      await this.request(`/subscribers/${subscriber.id}`, { method: 'DELETE' });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to delete subscriber:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Adds a subscriber to a group.
   */
  public async addSubscriberToGroup(
    subscriberId: string,
    groupName: string
  ): Promise<{ success: boolean; error?: string }> {
    const groupId = GROUP_IDS[groupName];
    if (!groupId) {
      return { success: false, error: `Unknown group: ${groupName}` };
    }

    if (!this.isConfigured()) {
      console.log('[DEV] Would add subscriber to group:', { subscriberId, groupName });
      return { success: true };
    }

    try {
      await this.request(`/subscribers/${subscriberId}/groups/${groupId}`, {
        method: 'POST',
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to add subscriber to group:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Removes a subscriber from a group.
   */
  public async removeSubscriberFromGroup(
    subscriberId: string,
    groupName: string
  ): Promise<{ success: boolean; error?: string }> {
    const groupId = GROUP_IDS[groupName];
    if (!groupId) {
      return { success: false, error: `Unknown group: ${groupName}` };
    }

    if (!this.isConfigured()) {
      console.log('[DEV] Would remove subscriber from group:', { subscriberId, groupName });
      return { success: true };
    }

    try {
      await this.request(`/subscribers/${subscriberId}/groups/${groupId}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to remove subscriber from group:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ===========================================================================
  // Group Management
  // ===========================================================================

  /**
   * Gets all groups.
   */
  public async getGroups(): Promise<MailerLiteGroup[]> {
    if (!this.isConfigured()) {
      return [
        {
          id: 'dev-architects',
          name: 'Architects Active',
          active_count: 100,
          sent_count: 500,
          opens_count: 250,
          open_rate: { float: 0.5, string: '50%' },
          clicks_count: 100,
          click_rate: { float: 0.2, string: '20%' },
          unsubscribed_count: 10,
          unconfirmed_count: 5,
          bounced_count: 2,
          junk_count: 0,
          created_at: new Date().toISOString(),
        },
      ];
    }

    try {
      const response = await this.request<MailerLiteApiResponse>('/groups', {
        schema: MailerLiteApiResponseSchema,
      });

      const groupsArray = Array.isArray(response.data) ? response.data : [];
      return groupsArray.map((g: unknown) => MailerLiteGroupSchema.parse(g));
    } catch (error) {
      console.error('Failed to get groups:', error);
      return [];
    }
  }

  /**
   * Creates a new group.
   */
  public async createGroup(
    name: string
  ): Promise<{ success: boolean; groupId?: string; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would create group:', name);
      return { success: true, groupId: `dev-${Date.now()}` };
    }

    try {
      const response = await this.request<MailerLiteApiResponse>('/groups', {
        method: 'POST',
        body: { name },
        schema: MailerLiteApiResponseSchema,
      });

      const group = MailerLiteGroupSchema.parse(response.data);
      return { success: true, groupId: group.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create group:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ===========================================================================
  // Campaign Management
  // ===========================================================================

  /**
   * Creates a new email campaign.
   */
  public async createCampaign(data: {
    name: string;
    subject: string;
    content: string;
    groupIds: string[];
    from?: string;
    fromName?: string;
  }): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would create campaign:', data);
      return { success: true, campaignId: `dev-${Date.now()}` };
    }

    try {
      const response = await this.request<MailerLiteApiResponse>('/campaigns', {
        method: 'POST',
        body: {
          name: data.name,
          type: 'regular',
          emails: [
            {
              subject: data.subject,
              from: data.from ?? MAILERLITE_CONFIG.fromEmail,
              from_name: data.fromName ?? MAILERLITE_CONFIG.fromName,
              content: data.content,
            },
          ],
          groups: data.groupIds,
        },
        schema: MailerLiteApiResponseSchema,
      });

      const responseData = response.data as { id?: string };
      return { success: true, campaignId: responseData?.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to create campaign:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Schedules a campaign for sending.
   */
  public async scheduleCampaign(
    campaignId: string,
    sendAt: Date
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would schedule campaign:', { campaignId, sendAt });
      return { success: true };
    }

    try {
      await this.request(`/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        body: {
          delivery: 'scheduled',
          schedule: {
            date: sendAt.toISOString().split('T')[0],
            hours: sendAt.getUTCHours().toString().padStart(2, '0'),
            minutes: sendAt.getUTCMinutes().toString().padStart(2, '0'),
            timezone_id: 'UTC',
          },
        },
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to schedule campaign:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // ===========================================================================
  // Automation Triggers
  // ===========================================================================

  /**
   * Triggers an automation for a subscriber.
   * Used for onboarding sequences and other triggered workflows.
   */
  public async triggerAutomation(
    automationId: string,
    subscriberEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      console.log('[DEV] Would trigger automation:', { automationId, subscriberEmail });
      return { success: true };
    }

    try {
      // First get the subscriber
      const subscriber = await this.getSubscriber(subscriberEmail);
      if (!subscriber?.id) {
        return { success: false, error: 'Subscriber not found' };
      }

      // Trigger the automation by adding to the automation's trigger group
      // Note: MailerLite automations are typically triggered by group membership
      await this.request(`/automations/${automationId}/queue`, {
        method: 'POST',
        body: {
          subscriber_id: subscriber.id,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to trigger automation:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Triggers the onboarding sequence for a new user.
   */
  public async triggerOnboardingSequence(
    email: string,
    userType: 'buyer' | 'supplier'
  ): Promise<{ success: boolean; error?: string }> {
    // Get the appropriate automation ID based on user type
    const automationId =
      userType === 'buyer'
        ? process.env.MAILERLITE_AUTOMATION_BUYER_ONBOARDING
        : process.env.MAILERLITE_AUTOMATION_SUPPLIER_ONBOARDING;

    if (!automationId) {
      console.log(
        `[DEV] Onboarding automation not configured for ${userType}. Would trigger for:`,
        email
      );
      return { success: true };
    }

    return this.triggerAutomation(automationId, email);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let mailerLiteClientInstance: MailerLiteClient | null = null;

/**
 * Gets the singleton MailerLiteClient instance.
 */
export function getMailerLiteClient(): MailerLiteClient {
  if (!mailerLiteClientInstance) {
    mailerLiteClientInstance = new MailerLiteClient();
  }
  return mailerLiteClientInstance;
}

export default MailerLiteClient;
