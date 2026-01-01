import { AzureOpenAI } from "openai";
import { getAzureOpenAIConfig } from "@/lib/config/azure-openai";

const config = getAzureOpenAIConfig();

if (!config) {
  // If credentials are missing, we can't initialize the client properly.
  // We can either throw or export a dummy client that fails on use.
  // For safety, let's export null or throw when used.
  // However, top-level code execution might fail if we throw here.
  // Let's rely on the check inside functions.
}

export const getClient = () => {
  const config = getAzureOpenAIConfig();
  if (!config) {
    throw new Error("Azure OpenAI credentials not configured");
  }
  return new AzureOpenAI({
    apiKey: config.apiKey,
    endpoint: config.endpoint,
    apiVersion: config.apiVersion,
    deployment: config.deployment,
  });
};

export const azureOpenAIClient = config ? new AzureOpenAI({
  apiKey: config.apiKey,
  endpoint: config.endpoint,
  apiVersion: config.apiVersion,
  deployment: config.deployment,
}) : null;
