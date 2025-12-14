import { NextRequest, NextResponse } from 'next/server';
import { azureAssistant } from '@/lib/agents/assistant/azure-client';
import { createClient } from '@/lib/supabase/server';
import { logAgentActivity } from '@/lib/agents/monitoring';

export async function POST(req: NextRequest) {
    const { userId, message, conversationId } = await req.json();

    const supabase = await createClient();

    // Fetch conversation history
    let conversation;
    if (conversationId) {
        const { data } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', conversationId)
            .single();
        conversation = data;
    } else {
        // Create new conversation
        const { data } = await supabase
            .from('chat_conversations')
            .insert({ user_id: userId, messages: [] })
            .select()
            .single();
        conversation = data;
    }

    if (!conversation) {
        return NextResponse.json({ error: "Failed to create/fetch conversation" }, { status: 500 });
    }

    // Add user message to history
    // Cast existing messages to array safely
    const existingMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const messages = [
        ...existingMessages,
        { role: 'user', content: message }
    ];

    // Get AI response
    const aiResponse = await azureAssistant.chat({
        messages,
        userId,
        context: conversation.context
    });

    // Update conversation
    const updatedMessages = [
        ...messages,
        { role: 'assistant', content: aiResponse }
    ];

    await supabase
        .from('chat_conversations')
        .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

    await logAgentActivity({
        agentType: 'assistant',
        action: 'chat_response',
        status: 'success',
        metadata: { userId, conversationId: conversation.id }
    });

    return NextResponse.json({
        conversationId: conversation.id,
        response: aiResponse
    });
}
