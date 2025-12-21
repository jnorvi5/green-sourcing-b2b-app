import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { azureOpenAI, isAIEnabled } from '@/lib/azure-openai';

export async function POST(request: NextRequest) {
  let recipientType = '';
  let purpose = '';
  let context = '';

  try {
    const body = await request.json();
    recipientType = body.recipientType;
    purpose = body.purpose;
    context = body.context;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY && !isAIEnabled) {
      console.warn('No AI provider configured. Returning static template.');
      return NextResponse.json({
        success: true,
        email: getStaticTemplate(recipientType, purpose, context),
        warning: 'Generated with static template (No AI provider configured)'
      });
    }

    // Default mock response structure
    let emailTemplate = {
      subject: `GreenChainz - ${purpose}`,
      body: `Hi [Name],\n\nThis is a placeholder body.\n\nBest,\nJerit`,
      metadata: {
        generatedAt: new Date().toISOString(),
        recipientType,
        purpose,
        provider: 'mock'
      }
    };

    // Try Azure OpenAI first if enabled
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

        // Simple parsing logic
        const lines = text.split('\n').filter(l => l.trim());
        const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));

        let subject = emailTemplate.subject;
        let body = text;

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

        return NextResponse.json({ success: true, email: emailTemplate });

      } catch (aiError) {
        console.error('Azure OpenAI generation failed:', aiError);
        // Fall through to standard OpenAI or static
      }
    }

    // Fallback to standard OpenAI if Azure failed or not enabled, and API key exists
    if (process.env.OPENAI_API_KEY) {
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

        // Robustly extract the subject line
        const subjectMatch = generatedText.match(/^Subject:\s*(.*)/i) || generatedText.match(/Subject:\s*(.*)/i);

        if (subjectMatch) {
            subject = subjectMatch[1].trim();
            // Remove the subject line (and any preceding label) from the body
            body = generatedText.replace(/^Subject:.*(\r\n|\n|\r)/i, '').trim();
        }

        emailTemplate = {
            subject,
            body,
            metadata: {
                generatedAt: new Date().toISOString(),
                recipientType,
                purpose,
                model: 'gpt-4',
                provider: 'openai'
            }
        };

        return NextResponse.json({ success: true, email: emailTemplate });
    }

    // Final fallback
    return NextResponse.json({
      success: true,
      email: getStaticTemplate(recipientType, purpose, context),
      warning: 'Generated with static template (AI generation failed or not configured)'
    });

  } catch (error) {
    console.error('Email writer error:', error);
    // Fallback to static template on error
    return NextResponse.json({
      success: true,
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
