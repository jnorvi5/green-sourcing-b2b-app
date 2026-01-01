const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const appInsights = require("applicationinsights");

// Initialize Application Insights if connection string is present
const initAppInsights = () => {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .start();
    console.log("✅ Azure Application Insights initialized");
  } else {
    console.log("⚠️  APPLICATIONINSIGHTS_CONNECTION_STRING not found, skipping App Insights");
  }
};

// Initialize Key Vault Client
const getKeyVaultClient = () => {
  const keyVaultName = process.env.KEY_VAULT_NAME || "greenchianz-vault";
  const KVUri = `https://${keyVaultName}.vault.azure.net`;

  try {
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(KVUri, credential);
    console.log(`✅ Azure Key Vault client initialized for ${keyVaultName}`);
    return client;
  } catch (err) {
    console.error("❌ Failed to initialize Azure Key Vault client:", err.message);
    return null;
  }
};

// Helper to get secret
const getSecret = async (secretName) => {
  const client = getKeyVaultClient();
  if (!client) return null;
  
  try {
    const secret = await client.getSecret(secretName);
    return secret.value;
  } catch (err) {
    console.error(`❌ Failed to retrieve secret ${secretName}:`, err.message);
    return null;
  }
};

module.exports = {
  initAppInsights,
  getKeyVaultClient,
  getSecret
};
