/**
 * Azure Key Vault Service
 * Secure secrets management using Azure Key Vault
 * 
 * Resource: greenchianz-vault
 * Location: East US
 */

const { SecretClient } = require('@azure/keyvault-secrets');
const { getCredential, azureConfig } = require('../config/azure');

class AzureKeyVaultService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.config = azureConfig.keyVault;
    this.cache = new Map();
  }

  /**
   * Initialize Key Vault client
   */
  async init() {
    if (!this.config.enabled) {
      console.log('[KeyVault] Key Vault is disabled, using environment variables');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      const credential = getCredential();
      this.client = new SecretClient(this.config.vaultUrl, credential);
      this.isInitialized = true;
      console.log(`[KeyVault] Initialized: ${this.config.vaultUrl}`);
      return true;
    } catch (error) {
      console.error('[KeyVault] Failed to initialize:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get secret from Key Vault
   */
  async getSecret(secretName) {
    // Check cache first
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }

    if (!this.isInitialized) {
      // Fall back to environment variable
      const envValue = process.env[secretName.toUpperCase().replace(/-/g, '_')];
      if (envValue) {
        console.log(`[KeyVault] Using env var for ${secretName}`);
        return envValue;
      }
      return null;
    }

    try {
      const secret = await this.client.getSecret(secretName);
      const value = secret.value;
      
      // Cache the secret
      this.cache.set(secretName, value);
      
      return value;
    } catch (error) {
      console.error(`[KeyVault] Error getting secret ${secretName}:`, error.message);
      
      // Fall back to environment variable
      const envValue = process.env[secretName.toUpperCase().replace(/-/g, '_')];
      if (envValue) {
        console.log(`[KeyVault] Using env var fallback for ${secretName}`);
        return envValue;
      }
      
      return null;
    }
  }

  /**
   * Set secret in Key Vault
   */
  async setSecret(secretName, secretValue) {
    if (!this.isInitialized) {
      console.error('[KeyVault] Cannot set secret - client not initialized');
      return false;
    }

    try {
      await this.client.setSecret(secretName, secretValue);
      
      // Update cache
      this.cache.set(secretName, secretValue);
      
      console.log(`[KeyVault] Secret ${secretName} updated`);
      return true;
    } catch (error) {
      console.error(`[KeyVault] Error setting secret ${secretName}:`, error.message);
      return false;
    }
  }

  /**
   * Delete secret from Key Vault
   */
  async deleteSecret(secretName) {
    if (!this.isInitialized) {
      console.error('[KeyVault] Cannot delete secret - client not initialized');
      return false;
    }

    try {
      await this.client.beginDeleteSecret(secretName);
      
      // Remove from cache
      this.cache.delete(secretName);
      
      console.log(`[KeyVault] Secret ${secretName} deleted`);
      return true;
    } catch (error) {
      console.error(`[KeyVault] Error deleting secret ${secretName}:`, error.message);
      return false;
    }
  }

  /**
   * Get all secrets (list names only)
   */
  async listSecrets() {
    if (!this.isInitialized) {
      console.error('[KeyVault] Cannot list secrets - client not initialized');
      return [];
    }

    try {
      const secretNames = [];
      for await (const secretProperties of this.client.listPropertiesOfSecrets()) {
        secretNames.push(secretProperties.name);
      }
      return secretNames;
    } catch (error) {
      console.error('[KeyVault] Error listing secrets:', error.message);
      return [];
    }
  }

  /**
   * Bulk get secrets
   */
  async getSecrets(secretNames) {
    const secrets = {};
    
    for (const name of secretNames) {
      const value = await this.getSecret(name);
      if (value) {
        secrets[name] = value;
      }
    }
    
    return secrets;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[KeyVault] Cache cleared');
  }

  /**
   * Common secret getters
   */
  async getDatabasePassword() {
    return await this.getSecret('database-password');
  }

  async getJwtSecret() {
    return await this.getSecret('jwt-secret');
  }

  async getRedisKey() {
    return await this.getSecret('redis-key');
  }

  async getStorageConnectionString() {
    return await this.getSecret('storage-connection-string');
  }

  async getApiKeys() {
    return {
      ec3: await this.getSecret('ec3-api-key'),
      fsc: await this.getSecret('fsc-api-key'),
      bcorp: await this.getSecret('bcorp-api-key'),
      documentIntelligence: await this.getSecret('document-intelligence-key'),
      apim: await this.getSecret('apim-subscription-key')
    };
  }
}

// Export singleton instance
const keyVaultService = new AzureKeyVaultService();

module.exports = {
  keyVaultService,
  AzureKeyVaultService
};
