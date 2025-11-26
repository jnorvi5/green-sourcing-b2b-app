#!/bin/bash

# Target Identifiers
RESOURCE_GROUP="rg-greenchainz-core-01"
RESOURCE_NAME="plan-greenchainz-backend"
RESOURCE_TYPE="Microsoft.Web/serverfarms"
AUTOSCALE_NAME="autoscale-$RESOURCE_NAME"

# Create the autoscale setting for the App Service Plan
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $RESOURCE_NAME \
  --resource-type $RESOURCE_TYPE \
  --name $AUTOSCALE_NAME \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Create the scale-up rule
az monitor autoscale rule create \
  --autoscale-name $AUTOSCALE_NAME \
  --resource-group $RESOURCE_GROUP \
  --condition "Percentage CPU > 80 avg 5m" \
  --scale out 1

# Create the scale-down rule
az monitor autoscale rule create \
  --autoscale-name $AUTOSCALE_NAME \
  --resource-group $RESOURCE_GROUP \
  --condition "Percentage CPU < 25 avg 10m" \
  --scale in 1
