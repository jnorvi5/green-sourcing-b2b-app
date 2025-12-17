import { AzureOpenAI } from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEPDData } from '../../autodesk-sda';

export class AzureAssistant {
    private client: AzureOpenAI | null = null;
    private _supabase: SupabaseClient | null = null;
    private deployment = 'gpt-4o';
    private initialized = false;

    private initialize() {
        if (this.initialized) return;

        if (process.env['AZURE_OPENAI_API_KEY'] && process.env['AZURE_OPENAI_ENDPOINT']) {
            this.client = new AzureOpenAI({
                apiKey: process.env['AZURE_OPENAI_API_KEY']!,
                endpoint: process.env['AZURE_OPENAI_ENDPOINT']!,
                apiVersion: '2024-02-15-preview'
            });
        } else {
            console.warn('Azure OpenAI credentials not set. AI features will use mock data.');
        }

        // Only initialize Supabase if env vars are available
        const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
        const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

        if (supabaseUrl && supabaseKey) {
            this._supabase = createClient(supabaseUrl, supabaseKey);
        }

        this.initialized = true;
    }

    private get supabase(): SupabaseClient {
        this.initialize();
        if (!this._supabase) {
            throw new Error('Supabase client not initialized. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
        }
        return this._supabase;
    }

    async chat(params: {
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        userId: string;
        context?: Record<string, unknown>;
    }) {
        this.initialize();

        if (!this.client) {
            return "Using mock response (Azure not configured): I found 3 recycled steel suppliers for you.";
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.deployment,
                messages: [
                    {
                        role: 'system',
                        content: `You are the GreenChainz AI assistant helping architects find verified sustainable building materials. 
            
    Context: ${JSON.stringify(params.context || {})}

    Guidelines:
    - Be concise and actionable
    - Always cite EPD data when available
    - Suggest relevant suppliers from our database
    - Help with RFQ creation`
                    },
                    ...params.messages
                ],
                max_tokens: 800,
                temperature: 0.7
            });

            return response.choices[0].message.content || "I couldn't generate a response.";
        } catch (error) {
            console.error("Azure OpenAI Error", error);
            return "I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }

    async auditProduct(productId: string) {
        this.initialize();

        if (!this.client) return "Mock Audit: Product looks sustainable.";

        // Fetch product details
        const { data: product, error } = await this.supabase
            .from('products')
            .select('name, description, certifications')
            .eq('id', productId)
            .single();

        if (error || !product) {
            console.error('Error fetching product:', error);
            return "Error: Could not find product to audit.";
        }

        // Integrate with Autodesk SDA API
        const epdData = await getEPDData(product.name);

        const response = await this.client.chat.completions.create({
            model: this.deployment,
            messages: [{
                role: 'system',
                content: `Analyze this product for sustainability compliance.

                Product: ${product.name}
                Description: ${product.description || 'N/A'}
                Certifications: ${(product.certifications || []).join(', ') || 'None'}

                Autodesk SDA Data:
                - Carbon Footprint: ${epdData.embodied_carbon_kg} kg CO2e
                - Source: ${epdData.source}
                - EPD URL: ${epdData.epd_url || 'Not available'}

                Provide a sustainability audit, highlighting pros, cons, and EPD verification status.`
            }],
            max_tokens: 1500
        });

        return response.choices[0].message.content || "I couldn't generate a response.";
    }
}

export const azureAssistant = new AzureAssistant();