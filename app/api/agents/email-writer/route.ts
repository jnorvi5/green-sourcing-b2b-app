import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { azureOpenAI, isAIEnabled } from '@/lib/azure-openai';

export async function POST(request: NextRequest) {
  try {
    const { recipientType, purpose, context } = await request.json();

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set. Returning static template.');
      return NextResponse.json({
        success: true,
        email: getStaticTemplate(recipientType, purpose, context),
        warning: 'Generated with static template (OpenAI API key missing)'
      });
    }
    // Default mock response
    let emailTemplate = {
      subject: `GreenChainz - ${purpose}`,
      body: `Hi [Name],

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Write a professional B2B email for GreenChainz:
    Recipient: ${recipientType}
    Purpose: ${purpose}
    Context: ${context}

    Instructions:
    - Start your response exactly with "Subject: <Your Subject Here>"
    - Then provide the email body.
    - Sign off as: Jerit Norville, Founder - founder@greenchainz.com
    - Keep it concise and professional.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional B2B email copywriter for GreenChainz, a marketplace for sustainable building materials. Your tone is professional, concise, and value-driven.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    // Parse the generated text to extract subject and body
    let subject = `GreenChainz - ${purpose}`;
    let body = generatedText;

    // Robustly extract the subject line (handling variations like "Subject:", "Subject Line:", etc if the model drifts, though instructions are explicit)
    const subjectMatch = generatedText.match(/^Subject:\s*(.*)/i) || generatedText.match(/Subject:\s*(.*)/i);

    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      // Remove the subject line (and any preceding label) from the body
      body = generatedText.replace(/^Subject:.*(\r\n|\n|\r)/i, '').trim();
    }

    const emailTemplate = {
      subject,
      body,
      metadata: {
        generatedAt: new Date().toISOString(),
        recipientType,
        purpose,
        model: 'gpt-4'
        provider: 'mock'
      }
    };

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

Format:
Subject: [subject line]

[email body]`;

        const response = await azureOpenAI.chat.completions.create({
          model: process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are Jerit Norville, CEO of GreenChainz. Write direct, confident cold emails."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        const text = response.choices[0].message.content || "";

        // Simple parsing logic similar to lib/azure/emailer.ts
        const lines = text.split('\n').filter(l => l.trim());
        const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));

        let subject = emailTemplate.subject;
        let body = emailTemplate.body;

        if (subjectLine) {
            subject = subjectLine.replace(/^subject:\s*/i, '').trim();
            // Assuming body follows subject
            const bodyStart = lines.findIndex(l => l.toLowerCase().startsWith('subject:')) + 1;
            body = lines.slice(bodyStart).join('\n').trim();
        } else {
            // Fallback if formatting is off, treat whole text as body
            body = text.trim();
        }

        emailTemplate = {
            subject,
            body,
            metadata: {
                generatedAt: new Date().toISOString(),
                recipientType,
                purpose,
                provider: 'azure-openai'
            }
        };

      } catch (aiError) {
        console.error('Azure OpenAI generation failed, falling back to mock:', aiError);
        // Fallback to mock is already set in emailTemplate
      }
    }

    return NextResponse.json({ success: true, email: emailTemplate });
  } catch (error) {
    console.error('Email writer error:', error);
    // Fallback to static template on error
    return NextResponse.json({
      success: true, // We still return success but with a fallback
      email: getStaticTemplate(recipientType, purpose, context),
      warning: 'Generated with static template (API error)'
    });
  }
}

function getStaticTemplate(recipientType: string, purpose: string, context: string) {
  return {
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
      isStatic: true
    }
  };
}
