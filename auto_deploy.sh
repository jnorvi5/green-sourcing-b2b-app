#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# ACR Details
ACR_NAME="acrgreenchainz01"
ACR_LOGIN_SERVER="$ACR_NAME.azurecr.io"
IMAGE_NAME="greenchainz-backend"

# Check if GITHUB_RUN_ID is set
if [ -z "$GITHUB_RUN_ID" ]; then
  echo "Error: GITHUB_RUN_ID is not set. This script should be run in a GitHub Actions environment."
  exit 1
fi

# 1. Log into Azure Container Registry
echo "Logging into ACR: $ACR_NAME"
az acr login --name $ACR_NAME

# 2. Build the Docker image with two tags
IMAGE_TAG_LATEST="$ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
IMAGE_TAG_BUILD="$ACR_LOGIN_SERVER/$IMAGE_NAME:build-$GITHUB_RUN_ID"

echo "Building Docker image..."
echo "Tagging as: $IMAGE_TAG_LATEST"
echo "Tagging as: $IMAGE_TAG_BUILD"

docker build \
  --cache-from $IMAGE_TAG_LATEST \
  -t $IMAGE_TAG_LATEST \
  -t $IMAGE_TAG_BUILD \
  .

# 3. Push both tags to the registry
echo "Pushing tags to ACR..."
docker push $IMAGE_TAG_LATEST
docker push $IMAGE_TAG_BUILD

# 4. Print success message
echo "IMAGE PUSH SUCCESSFUL"
