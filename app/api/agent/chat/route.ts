/**
 * Agent Chat API Route
 * POST /api/agent/chat - Handle chat interactions with the Microsoft Foundry Agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { FoundryAgent, AgentMessage } from '@/lib/agents/foundry-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request body. "messages" array is required.' },
        { status: 400 }
      );
    }

    const agent = new FoundryAgent();
    const updatedMessages = await agent.chat(messages as AgentMessage[]);

    return NextResponse.json({ messages: updatedMessages });

  } catch (error) {
    console.error('[Agent API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
