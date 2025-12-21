# Check if Azure CLI is installed
if (Get-Command "az" -ErrorAction SilentlyContinue) {
    Write-Host "Azure CLI is installed."
} else {
    Write-Host "Azure CLI is NOT installed. Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows"
    Write-Host "Or run: winget install -e --id Microsoft.AzureCLI"
    exit 1
}

# Login
Write-Host "Logging in to Azure..."
az login

# Configuration
$ResourceGroup = "rg-greenchainz-ai"
$Location = "eastus" # GPT-4o is available here
$HubName = "hub-greenchainz"
$ProjectName = "greenchainz-audit"
$ModelName = "gpt-4o"
$DeploymentName = "gpt-4o"

# Create Resource Group
Write-Host "Creating Resource Group: $ResourceGroup..."
az group create --name $ResourceGroup --location $Location

# Install AI extension
Write-Host "Installing Azure AI extension..."
az extension add --name ai --upgrade

# Create AI Hub (Workspace)
Write-Host "Creating AI Hub: $HubName..."
# Note: 'az ai hub create' might not be standard yet, often it's 'az ml workspace create' with kind=hub or via generic resource
# We will use 'az ml workspace create' as AI Hubs are essentially ML Workspaces in the backend or specific resource provider
az resource create --resource-group $ResourceGroup --namespace Microsoft.MachineLearningServices --resource-type workspaces --name $HubName --location $Location --properties '{"kind": "hub"}'

# Create AI Project
Write-Host "Creating AI Project: $ProjectName..."
az resource create --resource-group $ResourceGroup --namespace Microsoft.MachineLearningServices --resource-type workspaces --name $ProjectName --location $Location --properties "{`"kind`": `"project`", `"hub_id`": `"/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroup/providers/Microsoft.MachineLearningServices/workspaces/$HubName`"}"

# Retrieve Keys (for OpenAI)
# This usually requires getting the keys of the Azure OpenAI resource associated with the hub.
# For simplicity, this script sets up the container. The user might need to create the OpenAI resource specifically.

Write-Host "Azure AI Structure Created."
Write-Host "Go to https://ai.azure.com to deploy the GPT-4o model and get your API keys."
