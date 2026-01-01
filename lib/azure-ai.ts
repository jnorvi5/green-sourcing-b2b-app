import { getAzureOpenAIConfig } from './config/azure-openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getAzureOpenAIConfig();
  if (!config) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  // Implementation using fetch to avoid circular deps if client is heavy
  // Or just reuse the logic from config
  const url = `${config.endpoint}/openai/deployments/${config.deployment}/embeddings?api-version=${config.apiVersion}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey,
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002', // Ideally should be configurable too
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI Embedding API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
