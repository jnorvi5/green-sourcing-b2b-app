
import { POST } from '@/app/api/agents/email-writer/route';
import { NextRequest } from 'next/server';

// Mock OpenAI and Anthropic
jest.mock('openai', () => {
  return class OpenAI {
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Subject: Test Subject\n\nTest Body from OpenAI' } }]
        })
      }
    };
  };
});

jest.mock('@anthropic-ai/sdk', () => {
  return class Anthropic {
    messages = {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Subject: Test Subject\n\nTest Body from Anthropic' }]
      })
    };
  };
});

jest.mock('@/lib/azure-openai', () => ({
  azureOpenAI: null,
  isAIEnabled: false
}));

describe('Email Writer API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use OpenAI when API key is present', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.ANTHROPIC_API_KEY;

    const req = new NextRequest('http://localhost/api/agents/email-writer', {
      method: 'POST',
      body: JSON.stringify({
        recipientType: 'Architect',
        purpose: 'Introduction',
        context: 'Test context'
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.email.metadata.provider).toBe('openai');
    expect(data.email.body).toContain('Test Body from OpenAI');
  });

  it('should use Anthropic when OpenAI key is missing and Anthropic key is present', async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

    const req = new NextRequest('http://localhost/api/agents/email-writer', {
      method: 'POST',
      body: JSON.stringify({
        recipientType: 'Architect',
        purpose: 'Introduction',
        context: 'Test context'
      })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.email.metadata.provider).toBe('anthropic');
    expect(data.email.body).toContain('Test Body from Anthropic');
  });
});
