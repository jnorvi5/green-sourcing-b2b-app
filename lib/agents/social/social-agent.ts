import { linkedInClient } from './linkedin-client';
import { SOCIAL_TEMPLATES } from './templates';
import { createClient } from '@/lib/supabase/server';
import { logAgentActivity } from '../monitoring';

interface SocialTask {
    platform: 'linkedin' | 'twitter';
    type: 'new_supplier' | 'weekly_update' | 'thought_leadership';
    metadata: Record<string, unknown>;
}

export class SocialAgent {
    private queue: SocialTask[] = [];

    async addTask(task: SocialTask) {
        this.queue.push(task);
    }

    async processBatch() {
        const batch = this.queue.splice(0, 5); // Post 5 at a time max
        const results = await Promise.all(batch.map(task => this.post(task)));
        return results;
    }

    private async post(task: SocialTask) {
        const supabase = await createClient();

        try {
            let content: string;

            if (task.type === 'new_supplier') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const supplierName = (task.metadata as any)?.supplierName || 'Sustainable Supplier';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const productCategory = (task.metadata as any)?.productCategory || 'Building Materials';

                content = SOCIAL_TEMPLATES.newSupplier(
                    task.metadata['supplierName'] as string,
                    task.metadata['productCategory'] as string
                    supplierName as string,
                    productCategory as string
                );
            } else if (task.type === 'weekly_update') {
                content = SOCIAL_TEMPLATES.weeklyUpdate({
                    suppliers: task.metadata['suppliers'] as number,
                    architects: task.metadata['architects'] as number,
                    rfqs: task.metadata['rfqs'] as number
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content = SOCIAL_TEMPLATES.weeklyUpdate(task.metadata as any);
            } else {
                content = SOCIAL_TEMPLATES.thoughtLeadership(task.metadata['topic'] as string);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content = SOCIAL_TEMPLATES.thoughtLeadership((task.metadata as any)?.topic as string);
            }

            if (task.platform === 'linkedin') {
                if (!process.env['LINKEDIN_AUTHOR_URN']) {
                    if (!process.env['LINKEDIN_AUTHOR_URN']) {
                        console.warn("Skipping LinkedIn post: Missing URN");
                        return { success: false, error: "Missing URN" };
                    }
                    await linkedInClient.createPost({
                        authorUrn: process.env['LINKEDIN_AUTHOR_URN']!,
                        authorUrn: process.env['LINKEDIN_AUTHOR_URN']!,
                        text: content
                    });
                }

                // Log to Supabase
                await supabase.from('social_posts').insert({
                    platform: task.platform,
                    type: task.type,
                    content,
                    posted_at: new Date().toISOString(),
                    status: 'posted'
                });

                await logAgentActivity({
                    agentType: 'social',
                    action: 'create_post',
                    status: 'success',
                    metadata: { platform: task.platform, type: task.type }
                });

                return { success: true, platform: task.platform, type: task.type };
            } catch (error: unknown) {
                console.error(`Social post failed:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                await logAgentActivity({
                    agentType: 'social',
                    action: 'create_post',
                    status: 'error',
                    metadata: { platform: task.platform, error: errorMessage }
                });

                return { success: false, platform: task.platform, error };
            }
        }
}

    export const socialAgent = new SocialAgent();
