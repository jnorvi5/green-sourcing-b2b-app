import OpenAI from 'openai';

export class EmailAgent {
  private client: OpenAI;
  private deployment: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env['AZURE_OPENAI_API_KEY'],
      baseURL: `${process.env['AZURE_OPENAI_ENDPOINT']}/openai/deployments/${process.env['AZURE_OPENAI_DEPLOYMENT']}`,
      defaultQuery: { 'api-version': '2024-12-01-preview' },
      defaultHeaders: { 'api-key': process.env['AZURE_OPENAI_API_KEY'] },
    });
    this.deployment = process.env['AZURE_OPENAI_DEPLOYMENT']!;
  }

  async generate(company: string, points: string[]) {
    const response = await this.client.chat.completions.create({
      model: this.deployment,
      messages: [
        {
          role: "system",
          content: `You are Jerit Norville, CEO of GreenChainz. Write direct, confident cold emails (120 words max). Use short sentences. Sign: Best, Jerit Norville | Founder, GreenChainz | founder@greenchainz.com`
        },
        {
          role: "user",
          content: `Write email to ${company}\n\nKey points:\n${points.join('\n')}\n\nFormat:\nSubject: [subject line]\n\n[email body]`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const text = response.choices[0].message.content || "";
    const lines = text.split('\n').filter(l => l.trim());
    
    const subject = lines.find(l => l.toLowerCase().startsWith('subject:'))
      ?.replace(/^subject:\s*/i, '') || `Partnership - ${company}`;
    
    const bodyStart = lines.findIndex(l => !l.toLowerCase().startsWith('subject:'));
    const body = lines.slice(bodyStart).join('\n').trim();

    return { subject, body };
  }
}
