/**
 * Microsoft Foundry (Azure AI) Agent
 * 
 * An intelligent agent that helps users find sustainable materials by querying
 * multiple provider APIs (Autodesk, EC3, EPD International).
 */

import { AzureOpenAI } from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { searchMaterials as searchAutodesk } from '@/lib/integrations/autodesk/material-matcher';
import { EPDInternationalClient } from '@/lib/integrations/epd-international';
import { searchEC3Materials } from '@/lib/integrations/ec3/client';

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
      name: 'search_autodesk',
      description: 'Search for materials in the Autodesk database. Good for general material properties and BIM data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The material to search for (e.g., "concrete", "insulation")',
          },
        },
        required: ['query'],
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

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
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
      
      You have access to three powerful databases:
      1. **Autodesk**: For general material properties and BIM data.
      2. **EPD International**: For verified Environmental Product Declarations.
      3. **EC3**: For embodied carbon data (GWP) and low-carbon alternatives.

      When a user asks for a material:
      - Determine which database is most relevant.
      - You can call multiple tools if needed to get a complete picture.
      - Summarize the findings clearly, highlighting GWP (Global Warming Potential) and sustainability certifications.
      - If you find specific products, list them with their key stats.
      
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
        messages: messages as ChatCompletionMessageParam[],
        tools: tools as ChatCompletionTool[],
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
            if (functionName === 'search_autodesk') {
              const results = await searchAutodesk(functionArgs.query);
              toolResult = JSON.stringify(results.slice(0, 5)); // Limit to 5 results
            } else if (functionName === 'search_epd') {
              const epdClient = new EPDInternationalClient({
                apiKey: process.env['EPD_API_KEY'] || '',
              });
              // Note: fetchEPDs expects pagination options, but we want a search.
              // The client doesn't have a direct search method exposed in the interface I saw,
              // but let's assume we can fetch and filter or use a search endpoint if available.
              // Looking at the client code, it fetches /epds.
              // For now, let's try to fetch and filter client-side or assume the API supports query params if we modified it.
              // Actually, let's use fetchAllEPDs with a limit and pretend we searched,
              // OR better, let's just return a placeholder if search isn't implemented in the client yet.
              // Wait, I saw the client code. It has fetchEPDs. It doesn't seem to have a search query param.
              // I will implement a basic search by fetching recent EPDs and filtering by name for now.
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
          messages: [...messages, ...newMessages] as ChatCompletionMessageParam[],
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
