/**
 * Azure AI Foundry Integration
 * 
 * Client for generating personalized outreach emails using Azure OpenAI GPT-4o-mini.
 * Configured for the GreenChainz platform with specialized prompts for different lead types.
 */

import {
  EmailGenerationRequest,
  GeneratedEmail,
  EmailType,
  EmailTone,
} from '../types/outreach';

// =============================================================================
// Configuration
// =============================================================================

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'emailer';

// =============================================================================
// System Prompts
// =============================================================================

const SYSTEM_PROMPT = `You are a professional B2B outreach specialist for GreenChainz, the leading platform for verified sustainable building materials in the AEC (Architecture, Engineering, Construction) industry.

Your key responsibilities:
1. Write personalized, compelling outreach emails that resonate with the recipient's specific context
2. Focus on GreenChainz's unique value propositions:
   - Verified sustainability data for 50,000+ building products
   - Direct access to Environmental Product Declarations (EPDs)
   - LEED compliance tracking and documentation
   - Reduced risk of greenwashing claims
   - Streamlined procurement process

For SUPPLIERS, emphasize:
- The "Founding 50" program with exclusive benefits
- Access to sustainability-conscious buyers
- Verified certification display
- Market differentiation through verified sustainability credentials

For DATA PROVIDERS, emphasize:
- Partnership opportunities
- API integration possibilities
- Expanded market reach for their certification data
- Mutual benefit in sustainability data ecosystem

For ARCHITECTS, emphasize:
- Time savings in material research
- Simplified LEED documentation
- Access to verified EPD data
- Project sustainability reporting

For PARTNERS, emphasize:
- Strategic alignment on sustainability goals
- Integration opportunities
- Shared market expansion
- Industry leadership positioning

Always maintain a professional yet approachable tone. Personalize based on the recipient's company context, recent news, and certifications when available.`;

const getEmailTypeInstructions = (emailType: EmailType): string => {
  switch (emailType) {
    case EmailType.INITIAL:
      return `This is the INITIAL outreach email. Focus on:
- Strong, attention-grabbing subject line
- Personal connection or relevant hook
- Clear value proposition
- Soft call-to-action (suggesting a brief conversation)
- Keep it concise (150-200 words max)`;
    
    case EmailType.FOLLOW_UP_1:
      return `This is the FIRST follow-up email (sent ~5 days after initial). Focus on:
- Reference the previous email briefly
- Add new value or insight
- Share a relevant success story or statistic
- Slightly more direct call-to-action
- Keep it shorter than the initial email`;
    
    case EmailType.FOLLOW_UP_2:
      return `This is the SECOND follow-up email (sent ~5 days after first follow-up). Focus on:
- Brief acknowledgment they're busy
- Lead with value (resource, case study, or insight)
- Create mild urgency without pressure
- Direct ask for a specific time slot
- Very concise (100-150 words)`;
    
    case EmailType.FOLLOW_UP_3:
      return `This is the FINAL follow-up email (sent ~5 days after second follow-up). Focus on:
- "Break-up" email style
- Express understanding of their priorities
- Leave door open for future
- Mention you'll check back in a few months
- Include a simple yes/no question
- Shortest email (75-100 words)`;
    
    default:
      return '';
  }
};

const getToneInstructions = (tone: EmailTone): string => {
  switch (tone) {
    case EmailTone.FORMAL:
      return 'Use formal, professional language appropriate for C-suite executives and enterprise companies.';
    case EmailTone.FRIENDLY:
      return 'Use warm, conversational language while maintaining professionalism. Be personable and approachable.';
    case EmailTone.CASUAL:
      return 'Use casual, direct language as if writing to a colleague. Be brief and to the point.';
    default:
      return 'Use professional but friendly language.';
  }
};

// =============================================================================
// Email Generation
// =============================================================================

export async function generateOutreachEmail(
  request: EmailGenerationRequest
): Promise<GeneratedEmail> {
  // Validate configuration
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    throw new Error('Azure OpenAI credentials not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY environment variables.');
  }

  const { lead, emailType, tone = EmailTone.FRIENDLY } = request;

  // Build context string
  const contextParts: string[] = [];
  if (lead.context.companyDescription) {
    contextParts.push(`Company Description: ${lead.context.companyDescription}`);
  }
  if (lead.context.certifications && lead.context.certifications.length > 0) {
    contextParts.push(`Certifications: ${lead.context.certifications.join(', ')}`);
  }
  if (lead.context.recentNews) {
    contextParts.push(`Recent News: ${lead.context.recentNews}`);
  }
  if (lead.context.customHook) {
    contextParts.push(`Custom Hook: ${lead.context.customHook}`);
  }

  const userPrompt = `Generate an outreach email for the following lead:

**Lead Information:**
- Company: ${lead.companyName}
- Contact Name: ${lead.contactName}
- Role: ${lead.role}
- Lead Type: ${lead.leadType}
${contextParts.length > 0 ? '\n**Additional Context:**\n' + contextParts.join('\n') : ''}

**Email Requirements:**
${getEmailTypeInstructions(emailType)}

**Tone:**
${getToneInstructions(tone)}

**Output Format:**
Respond with a JSON object containing:
- "subject": The email subject line
- "body": The plain text email body
- "htmlBody": The HTML formatted email body (with appropriate styling for email clients)

Ensure the HTML body uses inline styles and is compatible with email clients. Use GreenChainz brand colors (dark theme with #10b981 as accent color).`;

  try {
    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API Error:', response.status, errorText);
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from Azure OpenAI');
    }

    const emailData = JSON.parse(content) as {
      subject: string;
      body: string;
      htmlBody: string;
    };

    // Validate response structure
    if (!emailData.subject || !emailData.body) {
      throw new Error('Invalid email response structure from Azure OpenAI');
    }

    // Generate HTML body if not provided
    const htmlBody = emailData.htmlBody || generateHtmlBody(emailData.body);

    return {
      subject: emailData.subject,
      body: emailData.body,
      htmlBody,
    };
  } catch (error) {
    console.error('Email generation error:', error);
    throw error instanceof Error ? error : new Error('Unknown error during email generation');
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

function generateHtmlBody(textBody: string): string {
  // Convert plain text to HTML with GreenChainz styling
  const paragraphs = textBody.split('\n\n').map(p => p.trim()).filter(p => p);
  
  const htmlParagraphs = paragraphs
    .map(p => `<p style="margin: 0 0 16px 0; color: #d1d5db; font-size: 15px; line-height: 1.6;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #111827; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #1f2937; border-radius: 16px; padding: 32px; border: 1px solid #374151;">
      ${htmlParagraphs}
    </div>
    <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} GreenChainz. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`.trim();
}

// =============================================================================
// Test Connection
// =============================================================================

export async function testAzureConnection(): Promise<boolean> {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    console.error('Azure OpenAI credentials not configured');
    return false;
  }

  try {
    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Say "connected" in one word.' },
        ],
        max_tokens: 10,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Azure connection test failed:', error);
    return false;
  }
}

export default {
  generateOutreachEmail,
  testAzureConnection,
};
