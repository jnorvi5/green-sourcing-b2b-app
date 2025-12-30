// Azure Infrastructure as Code (Bicep)
// This template deploys the GreenChainz Hybrid Architecture:
// 1. Azure Static Web Apps (Frontend)
// 2. Azure Functions (Backend/Jobs)
// 3. Azure OpenAI & Cognitive Search (AI)
// 4. Azure Storage & Database connections

param location string = resourceGroup().location
param appName string = 'greenchainz'
param environment string = 'prod'
param tags object = {
  Environment: environment
  Project: 'GreenChainz'
  Owner: 'founder@greenchainz.com'
}

// ============================================
// 1. Azure Static Web Apps (Frontend)
// ============================================
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${appName}-frontend-${environment}'
  location: location // Must be 'eastus2', 'centralus', 'westus2', 'westeurope', 'eastasia' for SWA free/standard
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: 'https://github.com/jerit/greenchainz' // Update with actual repo URL
    branch: 'main'
    provider: 'GitHub'
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
  tags: tags
}

// ============================================
// 2. Storage Account (General Purpose)
// ============================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: toLower('${appName}store${environment}')
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: true
  }
  tags: tags
}

// Storage Containers
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource containerImages 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'product-images'
  properties: {
    publicAccess: 'Blob'
  }
}

resource containerEpds 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'epd-pdfs'
  properties: {
    publicAccess: 'None'
  }
}

// ============================================
// 3. Application Insights & Monitoring
// ============================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appName}-logs-${environment}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: tags
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights-${environment}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
  tags: tags
}

// ============================================
// 4. Azure Functions (Backend/Jobs)
// ============================================
resource hostingPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  sku: {
    name: 'Y1' // Consumption Plan
    tier: 'Dynamic'
  }
  properties: {}
  tags: tags
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-functions-${environment}'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: hostingPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node' // Can be 'python' if migrating later, but currently code is TS/Node
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'NEXT_API_BASE_URL'
          value: 'https://${staticWebApp.properties.defaultHostname}' // Connects Function to Frontend
        }
      ]
      linuxFxVersion: 'Node|20' // Use Node 20
    }
    httpsOnly: true
  }
  tags: tags
}

// ============================================
// 5. Azure AI Services
// ============================================
resource cognitiveService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: '${appName}-openai-${environment}'
  location: location // Needs to be in a region with OpenAI availability (e.g., East US)
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: '${appName}-openai-${environment}'
  }
  tags: tags
}

resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: '${appName}-search-${environment}'
  location: location
  sku: {
    name: 'basic'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
  }
  tags: tags
}

// ============================================
// Outputs
// ============================================
output staticWebAppHostname string = staticWebApp.properties.defaultHostname
output functionAppHostname string = functionApp.properties.defaultHostName
output storageAccountName string = storageAccount.name
output openAiEndpoint string = cognitiveService.properties.endpoint
