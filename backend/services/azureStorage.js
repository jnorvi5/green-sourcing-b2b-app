/**
 * Azure Storage Service
 * Blob storage for documents, certifications, and files
 * 
 * Storage Accounts:
 * - greenchainzscraper (main application storage)
 * - revitfiles (CAD/BIM files)
 * - logicapp342954358599 (logic app workflows)
 */

const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { azureConfig } = require('../config/azure');
const { keyVaultService } = require('./azureKeyVault');

class AzureStorageService {
  constructor() {
    this.clients = {};
    this.config = azureConfig.storage;
    this.isInitialized = false;
  }

  /**
   * Initialize storage clients
   */
  async init() {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Initialize main storage account
      await this.initializeStorageAccount('main', this.config.main);
      
      // Initialize Revit storage account
      await this.initializeStorageAccount('revit', this.config.revit);
      
      this.isInitialized = true;
      console.log('[Storage] All storage accounts initialized');
      return true;
    } catch (error) {
      console.error('[Storage] Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Initialize individual storage account
   */
  async initializeStorageAccount(name, config) {
    try {
      let connectionString = config.connectionString;
      
      // Try to get from Key Vault if not in config
      if (!connectionString) {
        connectionString = await keyVaultService.getSecret(`storage-${name}-connection`);
      }
      
      if (!connectionString) {
        console.log(`[Storage] No connection string for ${name}, skipping`);
        return;
      }

      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      this.clients[name] = blobServiceClient;
      
      // Create containers if they don't exist
      if (config.containers) {
        for (const containerName of Object.values(config.containers)) {
          const containerClient = blobServiceClient.getContainerClient(containerName);
          await containerClient.createIfNotExists({ access: 'private' });
        }
      }
      
      console.log(`[Storage] Initialized ${name} storage account`);
    } catch (error) {
      console.error(`[Storage] Error initializing ${name}:`, error.message);
    }
  }

  /**
   * Upload file to blob storage
   */
  async uploadFile(storageAccount, containerName, fileName, fileBuffer, options = {}) {
    if (!this.clients[storageAccount]) {
      throw new Error(`Storage account ${storageAccount} not initialized`);
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream'
        },
        metadata: options.metadata || {}
      };

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);
      
      console.log(`[Storage] Uploaded ${fileName} to ${containerName}`);
      return {
        url: blockBlobClient.url,
        name: fileName,
        container: containerName
      };
    } catch (error) {
      console.error(`[Storage] Error uploading ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Download file from blob storage
   */
  async downloadFile(storageAccount, containerName, fileName) {
    if (!this.clients[storageAccount]) {
      throw new Error(`Storage account ${storageAccount} not initialized`);
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const downloadResponse = await blockBlobClient.download();
      const chunks = [];
      
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`[Storage] Error downloading ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete file from blob storage
   */
  async deleteFile(storageAccount, containerName, fileName) {
    if (!this.clients[storageAccount]) {
      throw new Error(`Storage account ${storageAccount} not initialized`);
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.deleteIfExists();
      console.log(`[Storage] Deleted ${fileName} from ${containerName}`);
      return true;
    } catch (error) {
      console.error(`[Storage] Error deleting ${fileName}:`, error.message);
      return false;
    }
  }

  /**
   * List files in container
   */
  async listFiles(storageAccount, containerName, prefix = '') {
    if (!this.clients[storageAccount]) {
      throw new Error(`Storage account ${storageAccount} not initialized`);
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const files = [];

      for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        files.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified,
          contentType: blob.properties.contentType
        });
      }

      return files;
    } catch (error) {
      console.error(`[Storage] Error listing files in ${containerName}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate SAS token for file access
   */
  async generateSasToken(storageAccount, containerName, fileName, expiryMinutes = 60) {
    if (!this.clients[storageAccount]) {
      throw new Error(`Storage account ${storageAccount} not initialized`);
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      const startsOn = new Date();
      const expiresOn = new Date(startsOn.getTime() + expiryMinutes * 60 * 1000);

      const permissions = BlobSASPermissions.parse('r'); // Read only

      const sasToken = await blockBlobClient.generateSasUrl({
        permissions,
        startsOn,
        expiresOn
      });

      return sasToken;
    } catch (error) {
      console.error(`[Storage] Error generating SAS token for ${fileName}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(storageAccount, containerName, fileName) {
    if (!this.clients[storageAccount]) {
      return false;
    }

    try {
      const containerClient = this.clients[storageAccount].getContainerClient(containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      return await blockBlobClient.exists();
    } catch (error) {
      console.error(`[Storage] Error checking ${fileName}:`, error.message);
      return false;
    }
  }

  /**
   * Upload certification document
   */
  async uploadCertification(fileName, fileBuffer, metadata = {}) {
    return await this.uploadFile('main', this.config.main.containers.certifications, fileName, fileBuffer, {
      contentType: 'application/pdf',
      metadata
    });
  }

  /**
   * Upload Revit model
   */
  async uploadRevitModel(fileName, fileBuffer, metadata = {}) {
    return await this.uploadFile('revit', this.config.revit.containers.models, fileName, fileBuffer, {
      contentType: 'application/octet-stream',
      metadata
    });
  }

  /**
   * Upload report
   */
  async uploadReport(fileName, fileBuffer, metadata = {}) {
    return await this.uploadFile('main', this.config.main.containers.reports, fileName, fileBuffer, {
      contentType: 'application/pdf',
      metadata
    });
  }
}

// Export singleton instance
const storageService = new AzureStorageService();

module.exports = {
  storageService,
  AzureStorageService
};
