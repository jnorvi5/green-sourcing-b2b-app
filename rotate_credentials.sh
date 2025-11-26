#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration (User needs to set these for the GitHub part) ---
# Example: GH_REPO="your-org/your-repo"
GH_REPO=""
# Example: SECRET_NAME="AZURE_CREDENTIALS"
SECRET_NAME=""

# 1. Verify Authentication
echo "Verifying Azure login status..."
if ! az account show > /dev/null 2>&1; then
    echo "Error: You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi
echo "Azure account verified."

# 2. Dynamically Extract Service Principal ID
SP_DISPLAY_NAME="http://greenchainz-sp"
echo "Fetching Application ID for Service Principal with display name: $SP_DISPLAY_NAME"

APP_ID=$(az ad sp list --display-name "$SP_DISPLAY_NAME" --query "[0].appId" -o tsv)

if [ -z "$APP_ID" ]; then
    echo "Error: Could not find a Service Principal with display name '$SP_DISPLAY_NAME'."
    exit 1
fi
echo "Found Application ID: $APP_ID"

# 3. Reset the Credential
echo "Resetting credential for the Service Principal..."

# Ensure jq is installed for JSON parsing
if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is not installed. Please install it to proceed."
    exit 1
fi

# The output of this command is a JSON object containing the new secret.
NEW_CREDENTIAL=$(az ad sp credential reset --id "$APP_ID" --query "{appId:appId, displayName:displayName, name:name, password:password, tenant:tenant}" -o json)

if [ $? -ne 0 ]; then
    echo "Error: Failed to reset credential."
    exit 1
fi

NEW_SECRET=$(echo "$NEW_CREDENTIAL" | jq -r .password)
echo "Credential successfully reset. IMPORTANT: This is the only time the new secret will be displayed."
echo "New Secret: $NEW_SECRET"


# 4. Update GitHub Secret (Commented out by default for safety)
# This section demonstrates how to update a GitHub repository secret with the new credential.
# The 'gh' CLI must be installed and authenticated.
: <<'END_COMMENT'
if [ -n "$GH_REPO" ] && [ -n "$SECRET_NAME" ]; then
    echo "Updating GitHub secret '$SECRET_NAME' in repository '$GH_REPO'..."

    # Ensure gh is installed
    if ! command -v gh &> /dev/null; then
        echo "Error: The GitHub CLI ('gh') is not installed. Please install it to update secrets."
        exit 1
    fi

    # Update the secret
    echo "$NEW_CREDENTIAL" | gh secret set "$SECRET_NAME" --repo "$GH_REPO" --body -

    if [ $? -eq 0 ]; then
        echo "Successfully updated GitHub secret '$SECRET_NAME'."
    else
        echo "Error: Failed to update GitHub secret."
    fi
else
    echo "Skipping GitHub secret update. Set GH_REPO and SECRET_NAME variables to enable."
fi
END_COMMENT

echo "Script completed."
