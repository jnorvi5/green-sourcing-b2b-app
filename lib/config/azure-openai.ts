/**
 * Centralized Azure OpenAI Configuration
 *
 * This utility ensures consistent access to Azure OpenAI credentials
 * across the application, handling variations in environment variable names.
 */

export interface AzureOpenAIConfig {
  apiKey: string;
  endpoint: string;
  deployment: string;
  apiVersion: string;
}

export function getAzureOpenAIConfig(): AzureOpenAIConfig | null {
  // Check for API Key (multiple variations)
  const apiKey =
    process.env['AZURE_OPENAI_API_KEY'] ||
    process.env['AZURE_OPENAI_KEY'];

  // Check for Endpoint (multiple variations)
  const endpoint =
    process.env['AZURE_OPENAI_ENDPOINT'];

  // Check for Deployment (multiple variations)
  const deployment =
    process.env['AZURE_OPENAI_DEPLOYMENT_NAME'] ||
    process.env['AZURE_OPENAI_DEPLOYMENT'] ||
    'gpt-4o'; // Default fallback

  if (!apiKey || !endpoint) {
    // Only warn in development, or if explicitly requested
    if (process.env.NODE_ENV === 'development') {
      console.warn('Azure OpenAI credentials missing: API Key or Endpoint not found.');
    }
    return null;
  }

  return {
    apiKey,
    endpoint,
    deployment,
    apiVersion: '2024-02-15-preview' // Standardize API version
  };
}

// Helper to construct the full API URL if needed (for raw fetch calls)
export function getAzureOpenAIUrl(config: AzureOpenAIConfig): string {
  // Remove trailing slash if present
  const baseUrl = config.endpoint.endsWith('/')
    ? config.endpoint.slice(0, -1)
    : config.endpoint;

  return `${baseUrl}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;
}
