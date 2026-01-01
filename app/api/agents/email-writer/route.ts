import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { azureOpenAI, isAIEnabled } from '@/lib/azure-openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { recipientType, purpose, context } = await request.json();

    const hasOpenAI = !!process.env['OPENAI_API_KEY'];
    const hasAnthropic = !!process.env['ANTHROPIC_API_KEY'];

    // Check if any AI provider is configured
    if (!hasOpenAI && !isAIEnabled && !hasAnthropic) {
      console.warn('No AI provider configured. Returning static template.');
      return NextResponse.json({
        success: true,
        email: getStaticTemplate(recipientType, purpose, context),
        warning: 'Generated with static template (No AI provider configured)'
      });
    }

    // Construct the prompt based on user request + formatting instructions
    const basePrompt = `Write a professional B2B email for GreenChainz:
Recipient: ${recipientType}
Purpose: ${purpose}
Context: ${context}`;

    const formattingInstructions = `
Instructions:
- Start your response exactly with "Subject: <Your Subject Here>"
- Then provide the email body.
- Sign off as: Jerit Norville, Founder - founder@greenchainz.com
- Keep it concise and professional.
`;

    const fullPrompt = `${basePrompt}\n${formattingInstructions}`;

    // Try Foundry Agent (OUTREACH-SCALER) if configured
    const agentId = process.env['AGENT_OUTREACH_SCALER_ID'];
    if (agentId) {
      try {
        console.log("Delegating email generation to Foundry Agent:", agentId);
        const { invokeFoundryAgent } = await import('@/lib/azure-foundry');

        const agentRes = await invokeFoundryAgent(agentId, fullPrompt);

        if (agentRes.success && agentRes.text) {
          const { subject, body } = parseResponse(agentRes.text, purpose);
          return NextResponse.json({
            success: true,
            email: {
              subject,
              body,
              metadata: {
                generatedAt: new Date().toISOString(),
                recipientType,
                purpose,
                provider: 'foundry-agent',
                model: agentId
              }
            }
          });
        }
      } catch (agentError) {
        console.error('Foundry Agent invocation failed:', agentError);
        // Fall through to other providers
      }
    }

    // Try Azure OpenAI first if enabled
    if (isAIEnabled && azureOpenAI) {
      try {
        const response = await azureOpenAI.chat.completions.create({
          model: process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are Jerit Norville, CEO of GreenChainz. Write direct, confident cold emails."
            },
            {
              role: "user",
              content: fullPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        const text = response.choices[0].message.content || "";
        const { subject, body } = parseResponse(text, purpose);

        return NextResponse.json({
          success: true,
          email: {
            subject,
            body,
            metadata: {
              generatedAt: new Date().toISOString(),
              recipientType,
              purpose,
              provider: 'azure-openai',
              model: process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o"
            }
          }
        });

      } catch (aiError) {
        console.error('Azure OpenAI generation failed:', aiError);
        // Fall through to standard OpenAI
      }
    }

    // Fallback to standard OpenAI
    if (hasOpenAI) {
      try {
        const openai = new OpenAI({
          apiKey: process.env['OPENAI_API_KEY'],
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional B2B email copywriter for GreenChainz, a marketplace for sustainable building materials.'
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content || '';
        const { subject, body } = parseResponse(text, purpose);

        return NextResponse.json({
          success: true,
          email: {
            subject,
            body,
            metadata: {
              generatedAt: new Date().toISOString(),
              recipientType,
              purpose,
              model: 'gpt-4',
              provider: 'openai'
            }
          }
        });
      } catch (openAIError) {
        console.error('OpenAI generation failed:', openAIError);
        // Fall through to Anthropic
      }
    }

    // Try Anthropic
    if (hasAnthropic) {
      try {
        const anthropic = new Anthropic({
          apiKey: process.env['ANTHROPIC_API_KEY'],
        });

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: 'You are a professional B2B email copywriter for GreenChainz.',
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        });

        const text = message.content[0].type === 'text' ? message.content[0].text : '';
        const { subject, body } = parseResponse(text, purpose);

        return NextResponse.json({
          success: true,
          email: {
            subject,
            body,
            metadata: {
              generatedAt: new Date().toISOString(),
              recipientType,
              purpose,
              model: 'claude-3-5-sonnet-20241022',
              provider: 'anthropic'
            }
          }
        });

      } catch (anthropicError) {
        console.error('Anthropic generation failed:', anthropicError);
        // Fall through to static
      }
    }

    // Final fallback
    return NextResponse.json({
      success: true,
      email: getStaticTemplate(recipientType, purpose, context),
      warning: 'Generated with static template (AI generation failed or not configured)'
    });

  } catch (error) {
    console.error('Email writer error:', error);
    return NextResponse.json({
      success: true,
      email: getStaticTemplate('Unknown', 'Contact', 'Context unavailable due to error'),
      warning: 'Generated with static template (API error)'
    });
  }
}

// Helper to parse subject and body from AI response
function parseResponse(text: string, defaultPurpose: string) {
  // We do NOT filter empty lines here to preserve paragraph breaks
  const lines = text.split('\n');

  // Find line starting with Subject:
  const subjectLineIndex = lines.findIndex(l => l.match(/^Subject:/i));

  let subject = `GreenChainz - ${defaultPurpose}`;
  let body = text;

  if (subjectLineIndex !== -1) {
    const subjectLine = lines[subjectLineIndex];
    subject = subjectLine.replace(/^Subject:\s*/i, '').trim();

    // Body is everything after the subject line
    // We explicitly skip the subject line
    const bodyLines = lines.slice(subjectLineIndex + 1);

    // Trim leading/trailing empty lines from body, but preserve internal spacing
    // join back first
    body = bodyLines.join('\n').trim();
  } else {
    body = text.trim();
  }

  return { subject, body };
}

function getStaticTemplate(recipientType: string | undefined, purpose: string | undefined, context: string | undefined) {
  return {
    subject: `GreenChainz - ${purpose || 'Introduction'}`,
    body: `Hi [Name],

I'm Jerit Norville, founder of GreenChainz - the B2B marketplace for verified sustainable building materials.

${context || 'I noticed your work in sustainable architecture.'}

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
