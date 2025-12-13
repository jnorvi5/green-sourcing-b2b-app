/**
 * Microsoft Foundry (Azure AI) Agent
 * 
 * An intelligent agent that helps users find sustainable materials by querying
 * multiple provider APIs (Autodesk, EC3, EPD International) and the GreenChainz Marketplace.
 */

import { AzureOpenAI } from 'openai';
import { EPDInternationalClient } from '@/lib/integrations/epd-international';
import { searchEC3Materials } from '@/lib/integrations/ec3/client';
import { searchLocalSuppliers } from '@/lib/agents/tools/search';
import { fetchSustainabilityData } from '@/lib/agents/data-aggregation';

// Initialize Azure OpenAI Client
// Note: This requires AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT env vars
const getClient = () => {
  const apiKey = process.env['AZURE_OPENAI_API_KEY'];
  const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
  const deployment = process.env['AZURE_OPENAI_DEPLOYMENT_NAME'] || 'gpt-4';
  
  if (!apiKey || !endpoint) {
    console.warn('Azure OpenAI credentials not configured');
    return null;
  }

  return new AzureOpenAI({
    apiKey,
    endpoint,
    apiVersion: '2024-02-15-preview',
    deployment,
  });
};

// Tool Definitions
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_suppliers',
      description: 'Search for suppliers and products in the GreenChainz marketplace. Best for finding specific products available for purchase.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query (e.g., "low carbon concrete", "FSC plywood", "insulation")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_sustainability',
      description: 'Get detailed aggregated sustainability data (EC3, EPD, FSC, Autodesk) for a specific product.',
      parameters: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
            description: 'The ID of the product',
          },
          materialType: {
            type: 'string',
            description: 'The type of material (e.g., "Concrete", "Wood")',
          },
        },
        required: ['productId', 'materialType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_epd',
      description: 'Search for Environmental Product Declarations (EPDs) from EPD International. Best for verified environmental data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The product name or category to search for',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_ec3',
      description: 'Search for low-carbon materials in the EC3 (Building Transparency) database. Best for comparing GWP (Global Warming Potential).',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The material to search for',
          },
        },
        required: ['query'],
      },
    },
  },
] as const;

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class FoundryAgent {
  private client: AzureOpenAI | null;
  private deployment: string;

  constructor() {
    this.client = getClient();
    this.deployment = process.env['AZURE_OPENAI_DEPLOYMENT_NAME'] || 'gpt-4';
  }

  /**
   * Process a user message and generate a response, potentially calling tools.
   */
  async chat(history: AgentMessage[]): Promise<AgentMessage[]> {
    if (!this.client) {
      return [{
        role: 'assistant',
        content: 'I am not fully configured yet. Please check my Azure OpenAI credentials.',
      }];
    }

    const messages = [...history];
    
    // System prompt
    const systemMessage: AgentMessage = {
      role: 'system',
      content: `You are the GreenChainz Sustainability Agent. Your goal is to help architects and suppliers find sustainable building materials.
      
      You have access to the GreenChainz Marketplace and external databases:
      1. **GreenChainz Marketplace (search_suppliers)**: The PRIMARY source. Use this to find available products and suppliers.
      2. **Sustainability Details (check_sustainability)**: Use this to get deep validation for a specific GreenChainz product.
      3. **EPD International**: For verified Environmental Product Declarations (global).
      4. **EC3**: For embodied carbon data baselines.

      When a user asks to "find suppliers" or "search products":
      - ALWAYS start with 'search_suppliers'.
      - If found, present the products with their Supplier Name, GWP (Carbon), and Certifications.
      - If appropriate, offer to check more detailed sustainability data for a specific product.
      
      When presenting GWP, explain it simply (kg CO2e).
      Always prioritize low-carbon options.`,
    };

    // Ensure system message is first
    if (messages.length === 0 || messages[0].role !== 'system') {
      messages.unshift(systemMessage);
    }

    try {
      // First call to LLM
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages: messages as any,
        tools: tools as any,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      const responseMessage = choice.message;

      // Add assistant response to history
      const newMessages: AgentMessage[] = [{
        role: 'assistant',
        content: responseMessage.content,
        tool_calls: responseMessage.tool_calls,
      }];

      // Handle tool calls
      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          let toolResult: string;

          console.log(`[Agent] Calling tool: ${functionName}`, functionArgs);

          try {
            if (functionName === 'search_suppliers') {
              const results = await searchLocalSuppliers(functionArgs.query);
              toolResult = JSON.stringify(results.length > 0 ? results : "No suppliers found matching your criteria.");
            } else if (functionName === 'check_sustainability') {
              const data = await fetchSustainabilityData(functionArgs.productId, functionArgs.materialType);
              toolResult = JSON.stringify(data);
            } else if (functionName === 'search_epd') {
              const epdClient = new EPDInternationalClient({
                apiKey: process.env['EPD_API_KEY'] || '',
              });
              const allEpds = await epdClient.fetchEPDs({ limit: 20 });
              const filtered = allEpds.data.filter(epd => 
                epd.product_name?.toLowerCase().includes(functionArgs.query.toLowerCase())
              );
              toolResult = JSON.stringify(filtered.length > 0 ? filtered : "No matching EPDs found in recent entries.");
            } else if (functionName === 'search_ec3') {
              const results = await searchEC3Materials(functionArgs.query);
              toolResult = JSON.stringify(results);
            } else {
              toolResult = "Unknown tool";
            }
          } catch (error) {
            console.error(`[Agent] Tool execution error:`, error);
            toolResult = `Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          }

          // Add tool result to history
          newMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: functionName,
            content: toolResult,
          });
        }

        // Second call to LLM to summarize results
        const secondResponse = await this.client.chat.completions.create({
          model: this.deployment,
          messages: [...messages, ...newMessages] as any,
        });

        newMessages.push({
          role: 'assistant',
          content: secondResponse.choices[0].message.content,
        });
      }

      return newMessages;

    } catch (error) {
      console.error('[Agent] Chat error:', error);
      return [{
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again later.',
      }];
    }
  }
}
