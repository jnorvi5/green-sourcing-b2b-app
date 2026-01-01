interface ZohoConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    accountId: string;
}

class ZohoMailClient {
    private config: ZohoConfig;
    private accessToken: string | null = null;

    constructor() {
        this.config = {
            clientId: process.env['ZOHO_CLIENT_ID']!,
            clientSecret: process.env['ZOHO_CLIENT_SECRET']!,
            refreshToken: process.env['ZOHO_REFRESH_TOKEN']!,
<<<<<<< HEAD
            accountId: process.env['ZOHO_ACCOUNT_ID']!
=======
            accountId: process.env['ZOHO_ACCOUNT_ID']!,
>>>>>>> fd168402960996d95b98e9a96bf7650bddb9d034
        };
    }

    async getAccessToken(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: this.config.refreshToken,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                grant_type: 'refresh_token'
            })
        });

        const data = await response.json();
        this.accessToken = data.access_token;
        if (!this.accessToken) {
            throw new Error('Failed to obtain Zoho access token');
        }
        return this.accessToken;
    }

    async sendEmail(params: {
        to: string;
        subject: string;
        body: string;
        fromAddress?: string;
    }) {
        const token = await this.getAccessToken();

        const response = await fetch(
            `https://mail.zoho.com/api/accounts/${this.config.accountId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromAddress: params.fromAddress || 'partnerships@greenchainz.com',
                    toAddress: params.to,
                    subject: params.subject,
                    content: params.body,
                    mailFormat: 'html'
                })
            }
        );

        return response.json();
    }

    async checkInbox(folderId: string = 'inbox') {
        const token = await this.getAccessToken();

        const response = await fetch(
            `https://mail.zoho.com/api/accounts/${this.config.accountId}/messages/view?folderId=${folderId}&limit=50`,
            {
                headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
            }
        );

        return response.json();
    }
}

export const zohoClient = new ZohoMailClient();
