import { NextRequest, NextResponse } from 'next/server';
import { AzureClient } from '@/lib/agents/assistant/azure-client';

const azureAssistant = new AzureClient();

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    // Prepare prompt
    const prompt = `You are a helpful assistant for GreenChainz.

    User history: ${JSON.stringify(history)}
    User message: ${message}`;

    const completion = await azureAssistant.complete(prompt);

    return NextResponse.json({
        response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
