import { NextRequest, NextResponse } from 'next/server';
import { azureOpenAI, isAIEnabled } from '@/lib/azure-openai';

export async function POST(request: NextRequest) {
  try {
    const { recipientType, purpose, context } = await request.json();

    // Default mock template (fallback)
    let emailTemplate = {
      subject: `GreenChainz - ${purpose}`,
      body: `Hi [Name],

I'm Jerit Norville, founder of GreenChainz - the B2B marketplace for verified sustainable building materials.

${context}

We're targeting Q1 2026 launch with 50 suppliers and 200 architects. 

Would you be open to a 15-minute call this week?

Best,
Jerit Norville
Founder, GreenChainz
founder@greenchainz.com
434-359-2460`,
      metadata: {
        generatedAt: new Date().toISOString(),
        recipientType,
        purpose,
        source: 'mock'
      }
    };

    // If AI is enabled, try to generate the email using Azure OpenAI
    if (isAIEnabled && azureOpenAI) {
      try {
        const prompt = `Write a professional B2B email for GreenChainz:
Recipient: ${recipientType}
Purpose: ${purpose}
Context: ${context}

Template:
- Subject line
- Greeting
- Value proposition
- Call to action
- Sign: Jerit Norville, Founder - founder@greenchainz.com

Output the result as a valid JSON object with keys: "subject" and "body". The body should contain the full email content excluding the subject line.`;

        const response = await azureOpenAI.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional B2B email writer for GreenChainz, a sustainable building materials marketplace."
            },
            { role: "user", content: prompt }
          ],
          model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const content = response.choices[0].message.content;

        if (content) {
          const generated = JSON.parse(content);
          if (generated.subject && generated.body) {
            emailTemplate = {
              subject: generated.subject,
              body: generated.body,
              metadata: {
                generatedAt: new Date().toISOString(),
                recipientType,
                purpose,
                source: 'azure-openai'
              }
            };
          }
        }
      } catch (aiError) {
        console.error('Azure OpenAI generation failed, falling back to mock:', aiError);
        // Fallback to mock is already set in emailTemplate
      }
    }

    return NextResponse.json({ success: true, email: emailTemplate });
  } catch (error) {
    console.error('Email writer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}
