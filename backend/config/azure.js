/**
 * Azure Configuration Module
 * Centralized configuration for all Azure resources
 * 
 * Resources mapped from your Azure account:
 * - Container Registry: acrgreenchainzprod916
 * - Redis Cache: greenchainz (East US 2)
 * - Key Vault: greenchianz-vault
 * - Storage Accounts: greenchainzscraper, revitfiles, logicapp342954358599
 * - Application Insights: greenchainz-platform, greenchainz-scraper
 * - Document Intelligence: greenchainz-content-intel
 * - Container Apps: greenchainz-container
 * - Function Apps: greenchainz-scraper
 * - API Management: greenchainz-scraper-apim
 */

const { DefaultAzureCredential, ManagedIdentityCredential } = require('@azure/identity');
require('dotenv').config();

// Determine if running in Azure (use Managed Identity) or local (use DefaultAzureCredential)
const isAzureEnvironment = process.env.AZURE_ENVIRONMENT === 'true' || 
                           process.env.WEBSITE_INSTANCE_ID || 
                           process.env.CONTAINER_APP_NAME;

// Create appropriate credential
const credential = isAzureEnvironment 
  ? new ManagedIdentityCredential()
  : new DefaultAzureCredential();

const azureConfig = {
  // Subscription & Tenant
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || 'your-subscription-id',
  tenantId: process.env.AZURE_TENANT_ID || 'your-tenant-id',
  
  // Credential
  credential,
  
  // Resource Groups
  resourceGroups: {
    core: process.env.AZURE_RG_CORE || 'greenchainz-core-start',
    production: process.env.AZURE_RG_PRODUCTION || 'greenchainz-production',
    scraper: process.env.AZURE_RG_SCRAPER || 'greenchainzscraper',
    container: process.env.AZURE_RG_CONTAINER || 'rg-greenchainz-prod-container',
    ai: process.env.AZURE_RG_AI || 'greenchainz-ai',
    main: process.env.AZURE_RG_MAIN || 'rg-greenchainz'
  },

  // Redis Cache Configuration
  redis: {
    enabled: process.env.AZURE_REDIS_ENABLED === 'true',
    host: process.env.AZURE_REDIS_HOST || 'greenchainz.redis.cache.windows.net',
    port: parseInt(process.env.AZURE_REDIS_PORT || '6380', 10),
    password: process.env.AZURE_REDIS_KEY || '',
    tls: process.env.AZURE_REDIS_TLS !== 'false',
    db: parseInt(process.env.AZURE_REDIS_DB || '0', 10),
    keyPrefix: process.env.AZURE_REDIS_PREFIX || 'greenchainz:',
    connectionTimeout: 10000,
    enableOfflineQueue: true
  },

  // Key Vault Configuration
  keyVault: {
    enabled: process.env.AZURE_KEYVAULT_ENABLED === 'true',
    vaultName: process.env.AZURE_KEYVAULT_NAME || 'greenchianz-vault',
    vaultUrl: process.env.AZURE_KEYVAULT_URL || 'https://greenchianz-vault.vault.azure.net/'
  },

  // Storage Accounts
  storage: {
    // Main storage for application data
    main: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || 'greenchainzscraper',
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containers: {
        documents: 'documents',
        certifications: 'certifications',
        reports: 'reports',
        uploads: 'uploads'
      }
    },
    // Revit files storage
    revit: {
      accountName: process.env.AZURE_STORAGE_REVIT_ACCOUNT || 'revitfiles',
      connectionString: process.env.AZURE_STORAGE_REVIT_CONNECTION || '',
      containers: {
        models: 'revit-models',
        exports: 'revit-exports'
      }
    },
    // Logic app storage
    logicApp: {
      accountName: 'logicapp342954358599',
      connectionString: process.env.AZURE_STORAGE_LOGICAPP_CONNECTION || ''
    }
  },

  // Application Insights
  appInsights: {
    enabled: process.env.AZURE_APPINSIGHTS_ENABLED === 'true',
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATION_KEY || '',
    // Platform insights
    platform: {
      name: 'greenchainz-platform',
      resourceGroup: 'rg-greenchainz'
    },
    // Scraper insights
    scraper: {
      name: 'greenchainz-scraper',
      resourceGroup: 'greenchainzscraper'
    }
  },

  // Document Intelligence (Form Recognizer)
  documentIntelligence: {
    enabled: process.env.AZURE_DOC_INTEL_ENABLED === 'true',
    endpoint: process.env.AZURE_DOC_INTEL_ENDPOINT || 'https://greenchainz-content-intel.cognitiveservices.azure.com/',
    apiKey: process.env.AZURE_DOC_INTEL_KEY || '',
    region: 'eastus'
  },

  // Container Registry
  containerRegistry: {
    name: process.env.AZURE_REGISTRY_NAME || 'acrgreenchainzprod916',
    loginServer: process.env.AZURE_REGISTRY_SERVER || 'acrgreenchainzprod916.azurecr.io',
    username: process.env.AZURE_REGISTRY_USERNAME || '',
    password: process.env.AZURE_REGISTRY_PASSWORD || ''
  },

  // Container Apps
  containerApps: {
    environment: {
      name: process.env.AZURE_CONTAINER_ENV || 'cae-greenchainz-env',
      resourceGroup: 'rg-greenchainz-prod-container'
    },
    app: {
      name: process.env.AZURE_CONTAINER_APP || 'greenchainz-container',
      resourceGroup: 'rg-greenchainz-prod-container'
    }
  },

  // Function Apps
  functions: {
    scraper: {
      name: process.env.AZURE_FUNCTION_SCRAPER || 'greenchainz-scraper',
      resourceGroup: 'greenchainzscraper',
      hostKey: process.env.AZURE_FUNCTION_SCRAPER_KEY || ''
    }
  },

  // API Management
  apiManagement: {
    enabled: process.env.AZURE_APIM_ENABLED === 'true',
    serviceName: process.env.AZURE_APIM_NAME || 'greenchainz-scraper-apim',
    subscriptionKey: process.env.AZURE_APIM_KEY || '',
    endpoint: process.env.AZURE_APIM_ENDPOINT || 'https://greenchainz-scraper-apim.azure-api.net'
  },

  // Foundry Projects (AI Agent platforms)
  foundry: {
    geminis: {
      resourceName: 'gemenis-agents-resource',
      projectName: 'gemenis-agents',
      resourceGroup: 'greenchainz-ai'
    },
    greenchainzFoundry: {
      resourceName: 'greenchainz-foundry',
      projectName: 'greenchainz-emailer',
      resourceGroup: 'greenchainz-ai'
    },
    greenchainzResource: {
      resourceName: 'greenchainz-resource',
      projectName: 'greenchainz',
      resourceGroup: 'rg-greenchainz'
    }
  },

  // Log Analytics Workspaces
  logAnalytics: {
    containerApps: {
      name: 'workspace-rggreenchainzprodcontainer5PZ8',
      resourceGroup: 'rg-greenchainz-prod-container',
      workspaceId: process.env.AZURE_LOG_ANALYTICS_WORKSPACE_ID || ''
    },
    default: {
      name: 'DefaultWorkspace-f9164e8d-d74d-43ea-98d4-b0466b3ef8b8-EUS',
      resourceGroup: 'DefaultResourceGroup-EUS'
    }
  },

  // Regions
  regions: {
    primary: process.env.AZURE_PRIMARY_REGION || 'eastus',
    secondary: process.env.AZURE_SECONDARY_REGION || 'eastus2'
  }
};

// Helper function to get configuration
function getAzureConfig() {
  return azureConfig;
}

// Helper to check if running in Azure
function isAzure() {
  return isAzureEnvironment;
}

// Helper to get credential
function getCredential() {
  return credential;
}

module.exports = {
  azureConfig,
  getAzureConfig,
  isAzure,
  getCredential,
  credential
};
