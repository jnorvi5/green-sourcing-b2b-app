
import { AzureAssistant } from '../lib/agents/assistant/azure-client';
import { createClient } from '@supabase/supabase-js';
import { getEPDData } from '../lib/autodesk-sda';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));

jest.mock('../lib/autodesk-sda', () => ({
    getEPDData: jest.fn()
}));

jest.mock('openai', () => {
    return {
        AzureOpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [{
                            message: {
                                content: "Mocked AI Audit Response"
                            }
                        }]
                    })
                }
            }
        }))
    };
});

describe('AzureAssistant', () => {
    let mockSupabase: any;
    let assistant: AzureAssistant;

    beforeEach(() => {
        // Setup Supabase mock
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn()
        };
        (createClient as jest.Mock).mockReturnValue(mockSupabase);

        process.env['AZURE_OPENAI_API_KEY'] = 'test-key';
        process.env['AZURE_OPENAI_ENDPOINT'] = 'https://test.openai.azure.com';

        assistant = new AzureAssistant();
    });

    it('should audit a product successfully', async () => {
        // Mock product data
        mockSupabase.single.mockResolvedValue({
            data: {
                name: 'Test Product',
                description: 'A sustainable product',
                certifications: ['LEED']
            },
            error: null
        });

        // Mock EPD data
        (getEPDData as jest.Mock).mockResolvedValue({
            embodied_carbon_kg: 100,
            source: 'Mock Source',
            epd_url: 'http://example.com/epd'
        });

        const result = await assistant.auditProduct("product-123");

        expect(createClient).toHaveBeenCalled();
        expect(mockSupabase.from).toHaveBeenCalledWith('products');
        expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'product-123');
        expect(getEPDData).toHaveBeenCalledWith('Test Product');
        expect(result).toBe("Mocked AI Audit Response");
    });
});
