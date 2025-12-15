import { AzureOpenAI } from 'openai';

class AzureAssistant {
    private client: AzureOpenAI | null = null;
    private deployment = 'gpt-4o';

    constructor() {
        if (process.env['AZURE_OPENAI_API_KEY'] && process.env['AZURE_OPENAI_ENDPOINT']) {
            this.client = new AzureOpenAI({
                apiKey: process.env['AZURE_OPENAI_API_KEY'],
                endpoint: process.env['AZURE_OPENAI_ENDPOINT'],
                deployment: process.env['AZURE_OPENAI_DEPLOYMENT'],
                apiVersion: '2024-02-15-preview'
            });
        } else {
            console.warn('Azure OpenAI credentials missing');
        }
    }

    async chat(params: {
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        userId: string;
        context?: Record<string, unknown>;
    }) {
        if (!this.client) {
            return "Using mock response (Azure not configured): I found 3 recycled steel suppliers for you.";
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.deployment,
                messages: [
                    {
                        role: 'system',
                        content: `You are the GreenChainz AI assistant helping architects find verified sustainable building materials. 
            
    Context: ${JSON.stringify(params.context || {})}

    Guidelines:
    - Be concise and actionable
    - Always cite EPD data when available
    - Suggest relevant suppliers from our database
    - Help with RFQ creation`
                    },
                    ...params.messages
                ],
                max_tokens: 800,
                temperature: 0.7
            });

            return response.choices[0].message.content || "I couldn't generate a response.";
        } catch (error) {
            console.error("Azure OpenAI Error", error);
            return "I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }

    async auditProduct(_productId: string) {
        if (!this.client) return "Mock Audit: Product looks sustainable.";

        // TODO: Integrate with Autodesk SDA API
        // See mission_ai_audit.md for full spec
        const response = await this.client.chat.completions.create({
            model: this.deployment,
            messages: [{
                role: 'system',
                content: 'Analyze this product for sustainability compliance...'
            }],
            max_tokens: 1500
        });

        return response.choices[0].message.content;
    }
}

export const azureAssistant = new AzureAssistant();
