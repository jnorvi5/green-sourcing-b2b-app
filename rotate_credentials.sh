#!/bin/bash
set -e

# Exit if any of the required commands are not found.
command -v az >/dev/null 2>&1 || { echo >&2 "Azure CLI ('az') is required but not installed. Aborting."; exit 1; }
command -v gh >/dev/null 2>&1 || { echo >&2 "GitHub CLI ('gh') is required but not installed. Aborting."; exit 1; }

echo "Starting API key rotation process..."

# Step 1: Dynamically retrieve Azure account and service principal information.
echo "Fetching Azure subscription, tenant, and client IDs..."
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
CLIENT_ID=$(az ad sp list --display-name "http://greenchainz-sp" --query "[0].appId" -o tsv)

if [ -z "$SUBSCRIPTION_ID" ] || [ -z "$TENANT_ID" ] || [ -z "$CLIENT_ID" ]; then
  echo >&2 "Error: Failed to retrieve one or more required IDs from Azure. Aborting."
  exit 1
fi

echo "Successfully retrieved IDs."
echo "  - Subscription ID: $SUBSCRIPTION_ID"
echo "  - Tenant ID:       $TENANT_ID"
echo "  - Client ID:       $CLIENT_ID"

# Step 2: Reset the service principal credential to generate a new secret.
echo "Resetting Azure Service Principal credential..."
CLIENT_SECRET=$(az ad sp credential reset --name "http://greenchainz-sp" --query password -o tsv)

if [ -z "$CLIENT_SECRET" ]; then
  echo >&2 "Error: Failed to reset credential. The new secret is empty. Aborting."
  exit 1
fi

echo "Credential reset successful. A new client secret has been generated."

# Step 3: Construct the JSON payload for the GitHub secret.
echo "Constructing JSON payload for GitHub secret..."
JSON_PAYLOAD=$(printf '{
  "clientId": "%s",
  "clientSecret": "%s",
  "subscriptionId": "%s",
  "tenantId": "%s",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}' "$CLIENT_ID" "$CLIENT_SECRET" "$SUBSCRIPTION_ID" "$TENANT_ID")

# Step 4: Update the secret in GitHub.
echo "Updating the AZURE_CREDENTIALS secret in the GitHub repository..."
echo "$JSON_PAYLOAD" | gh secret set AZURE_CREDENTIALS --body -

echo "Successfully updated the AZURE_CREDENTIALS secret in GitHub."
echo "Key rotation process completed."
