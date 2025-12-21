import { createClient } from '@/lib/supabase/server';

export async function logAgentActivity(params: {
    agentType: 'scraper' | 'email' | 'social' | 'assistant';
    action: string;
    status: 'success' | 'error';
    metadata?: Record<string, unknown>;
}) {
    const supabase = await createClient();

    await supabase.from('agent_logs').insert({
        agent_type: params.agentType,
        action: params.action,
        status: params.status,
        metadata: params.metadata,
        created_at: new Date().toISOString()
    });
}
