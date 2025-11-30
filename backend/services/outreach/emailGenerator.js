/**
 * AI Email Generator
 * 
 * Uses Azure AI Foundry (or OpenAI-compatible API) to generate
 * personalized outreach emails based on templates and contact data.
 * 
 * Supports custom instructions that can be fed in to modify behavior.
 */

class EmailGenerator {
    constructor() {
        this.endpoint = process.env.AZURE_AI_ENDPOINT || process.env.OPENAI_API_BASE;
        this.apiKey = process.env.AZURE_AI_KEY || process.env.OPENAI_API_KEY;
        this.deployment = process.env.AZURE_AI_DEPLOYMENT || 'gpt-4';
        this.isAzure = !!process.env.AZURE_AI_ENDPOINT;
        this.customInstructions = null; // Set externally from OutreachService
    }

    /**
     * Set custom instructions (called by AgentRunner with compiled instructions)
     */
    setCustomInstructions(instructions) {
        this.customInstructions = instructions;
    }

    /**
     * Generate a personalized email for a contact
     */
    async generateEmail(contact, options = {}) {
        const {
            template = 'cold_outreach',
            campaignContext = {},
            tone = 'professional',
            maxLength = 300,
            customInstructions = null // Can also pass per-call instructions
        } = options;

        // Get template prompt
        const templatePrompt = this.getTemplatePrompt(template, contact, campaignContext);

        // Combine custom instructions
        const allInstructions = [
            this.customInstructions,
            customInstructions,
            campaignContext.instructions
        ].filter(Boolean).join('\n\n');

        // If no API configured, use fallback templates
        if (!this.apiKey) {
            console.log('[EmailGenerator] No AI API key configured, using fallback template');
            return this.getFallbackEmail(template, contact, campaignContext);
        }

        try {
            const response = await this.callAI(templatePrompt, {
                maxTokens: maxLength * 2,
                temperature: 0.7,
                customInstructions: allInstructions
            });

            // Parse the response
            const email = this.parseEmailResponse(response);

            return {
                success: true,
                subject: email.subject,
                body: email.body,
                generatedAt: new Date().toISOString(),
                template,
                aiGenerated: true,
                usedCustomInstructions: !!allInstructions
            };
        } catch (err) {
            console.error('[EmailGenerator] AI generation failed:', err.message);
            // Fall back to template
            return this.getFallbackEmail(template, contact, campaignContext);
        }
    }

    /**
     * Generate multiple email variations for A/B testing
     */
    async generateVariations(contact, options = {}) {
        const { count = 2, template = 'cold_outreach' } = options;
        const variations = [];

        for (let i = 0; i < count; i++) {
            const email = await this.generateEmail(contact, {
                ...options,
                template,
                variationHint: i === 0 ? 'direct and concise' : 'warm and conversational'
            });
            variations.push({ ...email, variation: String.fromCharCode(65 + i) }); // A, B, C...
        }

        return variations;
    }

    /**
     * Get the prompt for a specific template
     */
    getTemplatePrompt(template, contact, context) {
        const { firstname, lastname, company, jobtitle, customfields = {} } = contact;
        const name = firstname || 'there';
        const companyName = company || 'your company';

        const templates = {
            cold_outreach: `
You are writing a cold outreach email for GreenChainz, a B2B platform that helps construction companies find verified sustainable building materials.

Recipient Details:
- Name: ${name} ${lastname || ''}
- Company: ${companyName}
- Title: ${jobtitle || 'Professional'}
- Has EPD: ${customfields.hasEPD ? 'Yes' : 'Unknown'}
- Has FSC Cert: ${customfields.hasFSC ? 'Yes' : 'Unknown'}

Write a personalized, concise email that:
1. Opens with a relevant hook about sustainable construction/materials
2. Briefly mentions how GreenChainz can help them (${context.targetAudience === 'supplier' ? 'reach more buyers looking for sustainable products' : 'find verified sustainable suppliers faster'})
3. Includes a clear, soft call-to-action
4. Is under 150 words
5. Sounds human, not salesy

Format your response as:
SUBJECT: [subject line]
BODY:
[email body]
      `.trim(),

            follow_up: `
You are writing a follow-up email for GreenChainz. This is touch #${context.touchNumber || 2} in the sequence.

Recipient Details:
- Name: ${name}
- Company: ${companyName}
- Previous email sent: ${context.daysSinceLastEmail || 3} days ago

Write a brief follow-up that:
1. References the previous outreach without being pushy
2. Adds one new piece of value (industry insight, platform update, etc.)
3. Has a clear but gentle call-to-action
4. Is under 100 words

Format your response as:
SUBJECT: [subject line - can be a reply format like "Re: ..."]
BODY:
[email body]
      `.trim(),

            supplier_welcome: `
You are writing a welcome email for a new supplier considering GreenChainz.

Recipient Details:
- Name: ${name}
- Company: ${companyName}
- Products: ${customfields.productCategories || 'building materials'}

Write a warm welcome email that:
1. Thanks them for their interest
2. Highlights 2-3 key benefits for suppliers (visibility, verification, RFQs)
3. Provides clear next steps to get started
4. Is friendly and supportive in tone

Format your response as:
SUBJECT: [subject line]
BODY:
[email body]
      `.trim(),

            certification_reminder: `
You are writing an email to remind a supplier about certification opportunities.

Recipient Details:
- Name: ${name}
- Company: ${companyName}
- Current certifications: ${customfields.currentCerts || 'None listed'}

Write an informative email that:
1. Explains the value of EPD/FSC/EC3 certifications for their business
2. Mentions how GreenChainz can help with the verification process
3. Provides a helpful resource or next step
4. Is educational, not pushy

Format your response as:
SUBJECT: [subject line]
BODY:
[email body]
      `.trim(),

            re_engagement: `
You are writing a re-engagement email to a contact who hasn't responded to previous outreach.

Recipient Details:
- Name: ${name}
- Company: ${companyName}
- Last contacted: ${context.daysSinceLastEmail || 14}+ days ago

Write a final-touch email that:
1. Acknowledges they're busy (without being passive-aggressive)
2. Offers one compelling reason to respond
3. Makes it easy to opt out or stay in touch later
4. Is brief and respectful

Format your response as:
SUBJECT: [subject line]
BODY:
[email body]
      `.trim()
        };

        return templates[template] || templates.cold_outreach;
    }

    /**
     * Call the AI API
     */
    async callAI(prompt, options = {}) {
        const { maxTokens = 500, temperature = 0.7, customInstructions = '' } = options;

        const url = this.isAzure
            ? `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=2024-02-15-preview`
            : 'https://api.openai.com/v1/chat/completions';

        const headers = {
            'Content-Type': 'application/json',
            ...(this.isAzure
                ? { 'api-key': this.apiKey }
                : { 'Authorization': `Bearer ${this.apiKey}` }
            )
        };

        // Build system prompt with custom instructions
        let systemPrompt = 'You are an expert B2B email copywriter specializing in sustainable building materials and green construction. Your emails are concise, personalized, and effective.';

        if (customInstructions) {
            systemPrompt += '\n\n--- CUSTOM INSTRUCTIONS (MUST FOLLOW) ---\n' + customInstructions;
        }

        const body = {
            model: this.isAzure ? undefined : this.deployment,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: maxTokens,
            temperature
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`AI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Parse the AI response into subject and body
     */
    parseEmailResponse(response) {
        const lines = response.split('\n');
        let subject = '';
        let bodyLines = [];
        let inBody = false;

        for (const line of lines) {
            if (line.startsWith('SUBJECT:')) {
                subject = line.replace('SUBJECT:', '').trim();
            } else if (line.startsWith('BODY:')) {
                inBody = true;
            } else if (inBody) {
                bodyLines.push(line);
            }
        }

        // Fallback parsing if format wasn't followed
        if (!subject && !bodyLines.length) {
            const parts = response.split('\n\n');
            subject = parts[0]?.substring(0, 100) || 'Quick question about sustainable materials';
            bodyLines = parts.slice(1);
        }

        return {
            subject: subject || 'Sustainable materials for your next project',
            body: bodyLines.join('\n').trim() || response
        };
    }

    /**
     * Get fallback email when AI is not available
     */
    getFallbackEmail(template, contact, context) {
        const name = contact.firstname || 'there';
        const company = contact.company || 'your company';

        const fallbacks = {
            cold_outreach: {
                subject: `Sustainable materials for ${company}?`,
                body: `Hi ${name},

I came across ${company} and thought you might be interested in GreenChainz - we're helping construction companies find verified sustainable building materials faster.

Our platform connects ${context.targetAudience === 'supplier' ? 'suppliers like you with buyers actively looking for EPD-verified and FSC-certified products' : 'buyers with pre-verified suppliers who have EPD and FSC certifications'}.

Would you be open to a quick look at how we could help?

Best,
The GreenChainz Team`
            },

            follow_up: {
                subject: `Re: Sustainable materials for ${company}`,
                body: `Hi ${name},

Just wanted to follow up on my previous note about GreenChainz.

I know you're busy, so I'll keep this brief: we just added ${context.newFeature || 'automated EPD verification'} which might be useful for ${company}.

Let me know if you'd like to learn more.

Best,
The GreenChainz Team`
            },

            supplier_welcome: {
                subject: `Welcome to GreenChainz, ${name}!`,
                body: `Hi ${name},

Thanks for your interest in GreenChainz! We're excited to help ${company} connect with buyers looking for sustainable building materials.

Here's what you can do next:
1. Complete your supplier profile
2. Add your products with certification details
3. Start receiving RFQs from verified buyers

Questions? Just reply to this email.

Best,
The GreenChainz Team`
            },

            re_engagement: {
                subject: `One last note, ${name}`,
                body: `Hi ${name},

I've reached out a couple of times about GreenChainz and haven't heard back - totally understand if the timing isn't right.

If sustainable sourcing isn't a priority for ${company} right now, no worries at all. But if you'd like to stay in the loop for when it is, just let me know.

Either way, wishing you the best.

The GreenChainz Team`
            }
        };

        const fallback = fallbacks[template] || fallbacks.cold_outreach;

        return {
            success: true,
            subject: fallback.subject,
            body: fallback.body,
            generatedAt: new Date().toISOString(),
            template,
            aiGenerated: false
        };
    }
}

module.exports = EmailGenerator;
