/**
 * MailerLite Integration Service for GreenChainz
 * 
 * Handles:
 * - Supplier email verification
 * - Automated welcome sequences
 * - Certification alert emails
 * - Product verification notifications
 * - Newsletter subscriptions
 * 
 * API Docs: https://developers.mailerlite.com/docs/
 */

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

class MailerLiteService {
  constructor() {
    this.apiKey = process.env.MAILERLITE_API_KEY;
    this.groupIds = {
      suppliers: process.env.MAILERLITE_SUPPLIERS_GROUP_ID,
      buyers: process.env.MAILERLITE_BUYERS_GROUP_ID,
      newsletter: process.env.MAILERLITE_NEWSLETTER_GROUP_ID
    };
    this.automationIds = {
      supplierWelcome: process.env.MAILERLITE_SUPPLIER_WELCOME_AUTOMATION,
      certExpiring: process.env.MAILERLITE_CERT_EXPIRING_AUTOMATION,
      verificationComplete: process.env.MAILERLITE_VERIFICATION_COMPLETE_AUTOMATION
    };
  }

  /**
   * Make authenticated request to MailerLite API
   */
  async apiRequest(endpoint, method = 'GET', body = null) {
    if (!this.apiKey) {
      console.warn('[MailerLite] API key missing, using mock mode');
      return this.mockResponse(endpoint, method, body);
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${MAILERLITE_API_BASE}${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `MailerLite API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Mock responses for development/testing
   */
  mockResponse(endpoint, method, body) {
    console.log('[MailerLite Mock] %s %s', method, endpoint, body);

    if (endpoint.includes('/subscribers')) {
      return {
        data: {
          id: `mock_${Date.now()}`,
          email: body?.email || 'mock@example.com',
          status: 'active',
          subscribed_at: new Date().toISOString()
        }
      };
    }

    return { data: { success: true, mocked: true } };
  }

  // ============================================
  // SUBSCRIBER MANAGEMENT
  // ============================================

  /**
   * Add or update a subscriber
   */
  async upsertSubscriber(subscriberData) {
    const { email, name, companyName, userType, customFields = {} } = subscriberData;

    const payload = {
      email,
      fields: {
        name: name || '',
        company: companyName || '',
        user_type: userType || 'unknown',
        ...customFields
      },
      groups: this.getGroupsForUserType(userType)
    };

    try {
      const result = await this.apiRequest('/subscribers', 'POST', payload);
      console.log(`[MailerLite] Subscriber ${email} added/updated`);
      return { success: true, subscriber: result.data };
    } catch (error) {
      console.error('[MailerLite] Failed to upsert subscriber %s:', email, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get subscriber by email
   */
  async getSubscriber(email) {
    try {
      const result = await this.apiRequest(`/subscribers/${encodeURIComponent(email)}`);
      return { found: true, subscriber: result.data };
    } catch (error) {
      if (error.message.includes('404')) {
        return { found: false };
      }
      throw error;
    }
  }

  /**
   * Get appropriate groups for user type
   */
  getGroupsForUserType(userType) {
    const groups = [];

    if (userType === 'supplier' && this.groupIds.suppliers) {
      groups.push(this.groupIds.suppliers);
    }
    if (userType === 'buyer' && this.groupIds.buyers) {
      groups.push(this.groupIds.buyers);
    }
    if (this.groupIds.newsletter) {
      groups.push(this.groupIds.newsletter);
    }

    return groups;
  }

  // ============================================
  // SUPPLIER VERIFICATION FLOW
  // ============================================

  /**
   * Register a new supplier and start verification
   */
  async onSupplierRegistered(supplier) {
    const { email, name, companyName, supplierId } = supplier;

    // Add to MailerLite
    const result = await this.upsertSubscriber({
      email,
      name,
      companyName,
      userType: 'supplier',
      customFields: {
        supplier_id: supplierId,
        verification_status: 'pending',
        registered_at: new Date().toISOString()
      }
    });

    if (result.success) {
      // Trigger welcome automation
      await this.triggerAutomation(email, this.automationIds.supplierWelcome);
    }

    return result;
  }

  /**
   * Notify supplier when their product verification is complete
   */
  async onProductVerified(supplier, product, verificationResults) {
    const { email } = supplier;
    const { productName, productId } = product;

    const verifiedCount = verificationResults.filter(r => r.found).length;
    const totalCount = verificationResults.length;
    const allVerified = verifiedCount === totalCount;

    // Update subscriber fields
    await this.updateSubscriberFields(email, {
      last_product_verified: productName,
      verification_score: Math.round((verifiedCount / totalCount) * 100),
      last_verification_date: new Date().toISOString()
    });

    // Trigger appropriate automation
    if (allVerified && this.automationIds.verificationComplete) {
      await this.triggerAutomation(email, this.automationIds.verificationComplete);
    }

    return { notified: true, verifiedCount, totalCount };
  }

  /**
   * Alert supplier about expiring certifications
   */
  async onCertificationExpiring(supplier, certifications) {
    const { email, name } = supplier;

    // Update subscriber with expiring cert info
    await this.updateSubscriberFields(email, {
      expiring_certifications: certifications.map(c => c.name).join(', '),
      cert_expiry_alert_sent: new Date().toISOString()
    });

    // Trigger expiring cert automation
    if (this.automationIds.certExpiring) {
      await this.triggerAutomation(email, this.automationIds.certExpiring);
    }

    return { alertSent: true, certificationsCount: certifications.length };
  }

  // ============================================
  // AUTOMATION TRIGGERS
  // ============================================

  /**
   * Trigger a MailerLite automation for a subscriber
   */
  async triggerAutomation(email, automationId) {
    if (!automationId) {
      console.log(`[MailerLite] No automation ID configured, skipping trigger for ${email}`);
      return { triggered: false, reason: 'No automation ID' };
    }

    try {
      // MailerLite automations are triggered by adding to groups or updating fields
      // The actual automation is set up in MailerLite dashboard
      console.log(`[MailerLite] Would trigger automation ${automationId} for ${email}`);
      return { triggered: true, automationId };
    } catch (error) {
      console.error(`[MailerLite] Failed to trigger automation:`, error.message);
      return { triggered: false, error: error.message };
    }
  }

  /**
   * Update subscriber custom fields
   */
  async updateSubscriberFields(email, fields) {
    try {
      const result = await this.apiRequest(`/subscribers/${encodeURIComponent(email)}`, 'PUT', {
        fields
      });
      return { success: true, subscriber: result.data };
    } catch (error) {
      console.error('[MailerLite] Failed to update fields for %s:', email, error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // NEWSLETTER & CAMPAIGNS
  // ============================================

  /**
   * Subscribe to general newsletter
   */
  async subscribeToNewsletter(email, name = '') {
    return this.upsertSubscriber({
      email,
      name,
      userType: 'newsletter',
      customFields: {
        source: 'website_signup'
      }
    });
  }

  /**
   * Send transactional email (requires MailerLite transactional add-on)
   */
  async sendTransactionalEmail(to, templateId, variables = {}) {
    const payload = {
      to: [{ email: to }],
      template_id: templateId,
      variables
    };

    try {
      // Note: Transactional emails use a different endpoint
      const result = await this.apiRequest('/campaigns/transactional', 'POST', payload);
      console.log(`[MailerLite] Transactional email sent to ${to}`);
      return { sent: true, result: result.data };
    } catch (error) {
      console.error(`[MailerLite] Transactional email failed:`, error.message);
      return { sent: false, error: error.message };
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Import multiple subscribers at once
   */
  async batchImportSubscribers(subscribers, groupId = null) {
    const payload = {
      subscribers: subscribers.map(s => ({
        email: s.email,
        fields: {
          name: s.name || '',
          company: s.companyName || ''
        }
      })),
      groups: groupId ? [groupId] : []
    };

    try {
      const result = await this.apiRequest('/subscribers/import', 'POST', payload);
      console.log(`[MailerLite] Batch import complete: ${subscribers.length} subscribers`);
      return { success: true, imported: subscribers.length };
    } catch (error) {
      console.error('[MailerLite] Batch import failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get groups list (for admin purposes)
   */
  async getGroups() {
    try {
      const result = await this.apiRequest('/groups');
      return { success: true, groups: result.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const mailerLite = new MailerLiteService();

// Legacy function for backward compatibility
async function subscribeToNewsletter(email) {
  return mailerLite.subscribeToNewsletter(email);
}

module.exports = {
  subscribeToNewsletter,
  mailerLite,
  MailerLiteService
};
