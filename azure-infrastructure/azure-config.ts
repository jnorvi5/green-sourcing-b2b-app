import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

/**
 * Azure Configuration and Client Initializers
 * 
 * This module provides centralized access to Azure services.
 * It reads from environment variables which should be set in:
 * - .env.local (for local development)
 * - Azure Application Settings (for production)
 */

// ============================================
// Types
// ============================================

interface AzureConfig {
  openai: {
    endpoint: string;
    apiKey: string;
    deploymentName: string; // e.g., 'gpt-4'
    embeddingsDeploymentName: string; // e.g., 'text-embedding-ada-002'
  };
  search: {
    endpoint: string;
    apiKey: string;
    indexName: string;
  };
  storage: {
    connectionString: string;
    containerName: string;
  };
  functions: {
    url: string;
  };
}

// ============================================
// Configuration Loader
// ============================================

export const getAzureConfig = (): AzureConfig => {
  const config = {
    openai: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiKey: process.env.AZURE_OPENAI_KEY || '',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || 'gpt-4',
      embeddingsDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_EMBEDDINGS || 'text-embedding-ada-002',
    },
    search: {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
      apiKey: process.env.AZURE_SEARCH_KEY || '',
      indexName: process.env.AZURE_SEARCH_INDEX_PRODUCTS || 'products-index',
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containerName: process.env.AZURE_STORAGE_CONTAINER_IMAGES || 'product-images',
    },
    functions: {
      url: process.env.AZURE_FUNCTIONS_URL || '',
    }
  };

  // Validate critical config in production
  if (process.env.NODE_ENV === 'production') {
    if (!config.openai.endpoint) console.warn('Missing AZURE_OPENAI_ENDPOINT');
    if (!config.openai.apiKey) console.warn('Missing AZURE_OPENAI_KEY');
  }

  return config;
};

// ============================================
// Service Clients
// ============================================

let openAIClientInstance: OpenAIClient | null = null;

export const getOpenAIClient = () => {
  if (openAIClientInstance) return openAIClientInstance;

  const { openai } = getAzureConfig();

  if (!openai.endpoint || !openai.apiKey) {
    throw new Error("Azure OpenAI credentials not configured");
  }

  openAIClientInstance = new OpenAIClient(
    openai.endpoint,
    new AzureKeyCredential(openai.apiKey)
  );

  return openAIClientInstance;
};

/**
 * Example usage:
 *
 * import { getOpenAIClient, getAzureConfig } from './azure-config';
 *
 * const client = getOpenAIClient();
 * const config = getAzureConfig();
 * const result = await client.getChatCompletions(config.openai.deploymentName, messages);
 */
