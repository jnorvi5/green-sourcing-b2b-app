/**
 * Azure AI Foundry Integration for GreenChainz
 * 
 * This module provides integration with Azure services:
 * - Azure OpenAI (GPT-4, embeddings)
 * - Azure Cognitive Search
 * - Azure Storage (Blob)
 * - Application Insights
 */


// ============================================
// Configuration
// ============================================

const config = {
  openai: {
    endpoint: 