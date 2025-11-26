#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables
RESOURCE_GROUP="agent-logs-rg"
LOCATION="eastus"
WORKSPACE_NAME="agent-logs-workspace"
APP_INSIGHTS_NAME="agent-insights"

# Check if the user is logged in to Azure
if ! az account show > /dev/null 2>&1; then
    echo "You are not logged in to Azure. Please run 'az login' and try again."
    exit 1
fi

# Create a resource group
echo "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none

# Create a Log Analytics Workspace
echo "Creating Log Analytics Workspace '$WORKSPACE_NAME'..."
az monitor log-analytics workspace create --resource-group "$RESOURCE_GROUP" --workspace-name "$WORKSPACE_NAME" --output none

# Get the Log Analytics Workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP" --workspace-name "$WORKSPACE_NAME" --query "id" --output tsv)

# Create an Application Insights resource
echo "Creating Application Insights resource '$APP_INSIGHTS_NAME'..."
az monitor app-insights component create --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --workspace "$WORKSPACE_ID" \
    --kind "web" \
    --output none

# Get the Application Insights Connection String
echo "Retrieving Application Insights Connection String..."
CONNECTION_STRING=$(az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" --query "connectionString" --output tsv)

echo -e "\n--- Azure Monitor Setup Complete ---"
echo "Resource Group: $RESOURCE_GROUP"
echo "Log Analytics Workspace: $WORKSPACE_NAME"
echo "Application Insights: $APP_INSIGHTS_NAME"
echo -e "\nIMPORTANT: Set the following environment variable in your Azure Functions and Container Apps:"
echo "--------------------------------------------------"
echo "CONNECTION_STRING=$CONNECTION_STRING"
echo "--------------------------------------------------"
