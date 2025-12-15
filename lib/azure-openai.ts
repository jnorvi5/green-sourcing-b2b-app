import { AzureOpenAI } from "openai";

// Check if environment variables are set
const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
const apiKey = process.env['AZURE_OPENAI_API_KEY'];
const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'] || "gpt-4o";

if (!endpoint || !apiKey) {
  console.warn("Azure OpenAI credentials not set. AI features will use mock data.");
}

// Initialize the Azure OpenAI client
export const azureOpenAI = endpoint && apiKey 
  ? new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: "2024-05-01-preview", 
      deployment,
    })
  : null;

export const isAIEnabled = !!azureOpenAI;
