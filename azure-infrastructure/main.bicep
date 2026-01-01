// Azure Infrastructure as Code (Bicep)
// This template deploys the GreenChainz Platform on Azure App Service:
// 1. Azure App Service Plan (Linux)
// 2. Azure Web App (Next.js Application)
// 3. Azure Storage Account (Images, EPDs)
// 4. Azure OpenAI & Cognitive Search (AI)
// 5. Application Insights (Monitoring)

param location string = resourceGroup().location
param appName string = 'greenchainz-platform'
param environment string = 'prod'
param tags object = {
  Environment: environment
  Project: 'GreenChainz'
  Owner: 'founder@greenchainz.com'
}

// ============================================
// 1. Azure App Service (Web App)
// ============================================

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  sku: {
    name: 'B1' // Basic Tier (Start with B1 or P1v2 for production)
    tier: 'Basic'
    size: 'B1'
    family: 'B'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
  }
  tags: tags
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}' // e.g. greenchainz-platform
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts' // Use Node 20 LTS
      appCommandLine: 'node server.js' // Critical for Next.js Standalone
      alwaysOn: true // Keep app warm (Basic tier and up)
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
    }
  }
  tags: tags
}

// ============================================
// 2. Storage Account (General Purpose)
// ============================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: toLower(replace('${appName}store${environment}', '-', '')) // clean name
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

// Link App Insights to Web App
resource webAppConfig 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    ApplicationInsightsAgent_EXTENSION_VERSION: '~3'
    XDT_MicrosoftApplicationInsights_Mode: 'recommended'
    // Default Node settings
    WEBSITE_NODE_DEFAULT_VERSION: '~20'
    NODE_ENV: 'production'
    WEBSITE_RUN_FROM_PACKAGE: '1'
  }
}


// ============================================
// 4. Azure AI Services
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
output webAppHostname string = webApp.properties.defaultHostName
output storageAccountName string = storageAccount.name
output openAiEndpoint string = cognitiveService.properties.endpoint
