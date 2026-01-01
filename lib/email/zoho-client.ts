/**
 * Zoho Mail Client
 *
 * Handles sending transactional emails via Zoho Mail SMTP with OAuth2 authentication.
 * Includes automatic token refresh and caching.
 */

import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { z } from 'zod';
import {
  ZohoOAuthTokenSchema,
  type ZohoOAuthToken,
  type ZohoEmailPayload,
} from './types';

// =============================================================================
// Configuration
// =============================================================================

const ZOHO_CONFIG = {
  // SMTP Configuration
  smtpHost: process.env['ZOHO_SMTP_HOST'] ?? 'smtp.zoho.com',
  smtpPort: parseInt(process.env['ZOHO_SMTP_PORT'] ?? '587', 10),
  smtpUser: process.env['ZOHO_SMTP_USER'] ?? '',
  smtpPass: process.env['ZOHO_SMTP_PASS'] ?? '',

  // OAuth2 Configuration (for API-based sending)
  clientId: process.env['ZOHO_CLIENT_ID'] ?? '',
  clientSecret: process.env['ZOHO_CLIENT_SECRET'] ?? '',
  refreshToken: process.env['ZOHO_REFRESH_TOKEN'] ?? '',
  accountId: process.env['ZOHO_ACCOUNT_ID'] ?? '',

  // Sender Configuration
  fromEmail: process.env['ZOHO_FROM_EMAIL'] ?? 'noreply@greenchainz.com',
  fromName: process.env['ZOHO_FROM_NAME'] ?? 'GreenChainz',

  // OAuth2 Token URL
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  apiBaseUrl: 'https://mail.zoho.com/api/accounts',
} as const;

// =============================================================================
// Token Cache
// =============================================================================

interface CachedToken {
  token: ZohoOAuthToken;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

// =============================================================================
// Zoho Mail Client Class
// =============================================================================

export class ZohoMailClient {
  private transporter: Transporter | null = null;
  private useOAuth2: boolean;

  constructor() {
    // Determine if we should use OAuth2 or SMTP
    this.useOAuth2 = Boolean(
      ZOHO_CONFIG.clientId && ZOHO_CONFIG.clientSecret && ZOHO_CONFIG.refreshToken
    );
  }

  /**
   * Validates that the client is properly configured.
   */
  public isConfigured(): boolean {
    if (this.useOAuth2) {
      return Boolean(
        ZOHO_CONFIG.clientId &&
          ZOHO_CONFIG.clientSecret &&
          ZOHO_CONFIG.refreshToken &&
          ZOHO_CONFIG.accountId
      );
    }
    return Boolean(ZOHO_CONFIG.smtpUser && ZOHO_CONFIG.smtpPass);
  }

  /**
   * Refreshes the OAuth2 access token using the refresh token.
   */
  private async refreshAccessToken(): Promise<ZohoOAuthToken> {
    // Check cache first
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
      return tokenCache.token;
    }

    const params = new URLSearchParams({
      refresh_token: ZOHO_CONFIG.refreshToken,
      client_id: ZOHO_CONFIG.clientId,
      client_secret: ZOHO_CONFIG.clientSecret,
      grant_type: 'refresh_token',
    });

    const response = await fetch(ZOHO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh Zoho OAuth token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const token = ZohoOAuthTokenSchema.parse(data);

    // Cache the token with a 5-minute buffer before expiry
    tokenCache = {
      token,
      expiresAt: Date.now() + (token.expires_in - 300) * 1000,
    };

    return token;
  }

  /**
   * Gets or creates the SMTP transporter.
   */
  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    if (!ZOHO_CONFIG.smtpUser || !ZOHO_CONFIG.smtpPass) {
      throw new Error(
        'Zoho SMTP credentials not configured. Set ZOHO_SMTP_USER and ZOHO_SMTP_PASS.'
      );
    }

    this.transporter = nodemailer.createTransport({
      host: ZOHO_CONFIG.smtpHost,
      port: ZOHO_CONFIG.smtpPort,
      secure: ZOHO_CONFIG.smtpPort === 465,
      auth: {
        user: ZOHO_CONFIG.smtpUser,
        pass: ZOHO_CONFIG.smtpPass,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    return this.transporter;
  }

  /**
   * Sends an email via Zoho Mail API (OAuth2).
   */
  private async sendViaApi(payload: ZohoEmailPayload): Promise<{ messageId: string }> {
    const token = await this.refreshAccessToken();

    const response = await fetch(
      `${ZOHO_CONFIG.apiBaseUrl}/${ZOHO_CONFIG.accountId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${token.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: payload.fromAddress,
          toAddress: payload.toAddress,
          subject: payload.subject,
          content: payload.content,
          mailFormat: payload.mailFormat ?? 'html',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zoho Mail API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Zoho API returns status and data
    if (data.status?.code !== 200) {
      throw new Error(`Zoho Mail API error: ${data.status?.description ?? 'Unknown error'}`);
    }

    return {
      messageId: data.data?.messageId ?? `zoho-${Date.now()}`,
    };
  }

  /**
   * Sends an email via SMTP.
   */
  private async sendViaSMTP(options: {
    to: string;
    subject: string;
    text?: string;
    html: string;
    replyTo?: string;
  }): Promise<{ messageId: string }> {
    const transport = this.getTransporter();

    const mailOptions: SendMailOptions = {
      from: `"${ZOHO_CONFIG.fromName}" <${ZOHO_CONFIG.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo ?? ZOHO_CONFIG.fromEmail,
    };

    const info = await transport.sendMail(mailOptions);

    return {
      messageId: info.messageId,
    };
  }

  /**
   * Sends an email using the configured method (OAuth2 API or SMTP).
   */
  public async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate email format
    const emailSchema = z.string().email();
    const emailResult = emailSchema.safeParse(options.to);

    if (!emailResult.success) {
      return {
        success: false,
        error: 'Invalid recipient email address',
      };
    }

    if (!this.isConfigured()) {
      // Development fallback
      console.log('[DEV] Zoho email would be sent:', {
        to: options.to,
        subject: options.subject,
      });
      return {
        success: true,
        messageId: `dev-zoho-${Date.now()}`,
      };
    }

    try {
      let result: { messageId: string };

      if (this.useOAuth2) {
        result = await this.sendViaApi({
          fromAddress: ZOHO_CONFIG.fromEmail,
          toAddress: options.to,
          subject: options.subject,
          content: options.html,
          mailFormat: 'html',
        });
      } else {
        result = await this.sendViaSMTP(options);
      }

      console.log(`✅ Zoho email sent to ${options.to}, messageId: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send Zoho email to %s:', options.to, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verifies the SMTP connection.
   */
  public async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Zoho Mail not configured');
      return false;
    }

    if (this.useOAuth2) {
      try {
        await this.refreshAccessToken();
        console.log('✅ Zoho OAuth2 token verified');
        return true;
      } catch (error) {
        console.error(
          '❌ Zoho OAuth2 verification failed:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return false;
      }
    }

    try {
      const transport = this.getTransporter();
      await transport.verify();
      console.log('✅ Zoho SMTP connection verified');
      return true;
    } catch (error) {
      console.error(
        '❌ Zoho SMTP connection failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let zohoClientInstance: ZohoMailClient | null = null;

/**
 * Gets the singleton ZohoMailClient instance.
 */
export function getZohoClient(): ZohoMailClient {
  if (!zohoClientInstance) {
    zohoClientInstance = new ZohoMailClient();
  }
  return zohoClientInstance;
}

export default ZohoMailClient;
