# Azure AI Foundry Setup Guide

## 1. Apply for Credits

The user agent has opened `https://aka.ms/startup`.

- **Action**: Sign in with LinkedIn, complete the application.
- **Goal**: Get $1,000 - $150,000 in Azure credits.

## 2. Install Azure CLI

Since `az` was not found on your system, please install it:

```powershell
winget install -e --id Microsoft.AzureCLI
```

_Restart your terminal after installation._

## 3. Run Setup Script

Once installed and credits are active:

```powershell
./scripts/setup_azure_ai.ps1
```

This script will:

- Log you into Azure
- Create the `rg-greenchainz-audit` resource group
- Set up the AI Foundry Hub and Project

## 4. Deploy GPT-4o

1. Go to [Azure AI Foundry](https://ai.azure.com)
2. Select the `greenchainz-audit` project
3. Go to **Deployments** > **Create**
4. Select `gpt-4o`
5. Copy the **Endpoint** and **Key**.

## 5. Configure App

Add these to your `.env.local`:

```env
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```
