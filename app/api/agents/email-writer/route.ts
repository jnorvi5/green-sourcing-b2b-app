import { NextRequest, NextResponse } from 'next/server';
import { getAzureOpenAIConfig } from '@/lib/config/azure-openai';
import { AzureOpenAI } from 'openai';

export async function POST(request: NextRequest) {
  let recipientType = '';
  let purpose = '';
  let context = '';

  try {
    const body = await request.json();
    recipientType = body.recipientType;
    purpose = body.purpose;
    context = body.context;

    const config = getAzureOpenAIConfig();

    if (!config) {
      console.warn('Azure OpenAI credentials missing. Returning static template.');
      return NextResponse.json({
        success: true,
        email: getStaticTemplate(recipientType, purpose, context),
        warning: 'Generated with static template (Azure OpenAI credentials missing)'
      });
    }

    const client = new AzureOpenAI({
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      apiVersion: config.apiVersion,
      deployment: config.deployment,
    });

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

    const response = await client.chat.completions.create({
      model: config.deployment,
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

    const lines = text.split('\n').filter(l => l.trim());
    const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'));

    let subject = `GreenChainz - ${purpose}`;
    let emailBody = text;

    if (subjectLine) {
        subject = subjectLine.replace(/^subject:\s*/i, '').trim();
        // Assuming body follows subject
        const bodyStart = lines.findIndex(l => l.toLowerCase().startsWith('subject:')) + 1;
        emailBody = lines.slice(bodyStart).join('\n').trim();
    } else {
        emailBody = text.trim();
    }

    const emailTemplate = {
        subject,
        body: emailBody,
        metadata: {
            generatedAt: new Date().toISOString(),
            recipientType,
            purpose,
            provider: 'azure-openai'
        }
    };

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
