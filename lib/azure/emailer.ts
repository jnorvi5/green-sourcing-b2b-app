import OpenAI from 'openai';
import { getAzureOpenAIConfig } from '@/lib/config/azure-openai';

export class AzureEmailer {
  private client: OpenAI | null;
  private deployment: string;

  constructor() {
    const config = getAzureOpenAIConfig();

    if (config) {
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: `${config.endpoint}/openai/deployments/${config.deployment}`,
        defaultQuery: { 'api-version': config.apiVersion },
        defaultHeaders: { 'api-key': config.apiKey },
      });
      this.deployment = config.deployment;
    } else {
      console.warn('Azure OpenAI credentials missing for AzureEmailer');
      this.client = null;
      this.deployment = 'gpt-4o';
    }
  }

  async draftEmail(recipient: string, topic: string, context: string): Promise<string> {
    if (!this.client) {
      return "Email drafting unavailable: Missing Azure OpenAI credentials.";
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages: [
          { role: 'system', content: 'You are a professional assistant drafting emails for GreenChainz.' },
          { role: 'user', content: `Draft a professional email to ${recipient} about ${topic}. Context: ${context}` }
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || 'Failed to generate email draft.';
    } catch (error) {
      console.error('Error drafting email:', error);
      return 'Error generating email draft.';
    }
  }
}
