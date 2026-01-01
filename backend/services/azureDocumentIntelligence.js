/**
 * Azure Document Intelligence Service (formerly Form Recognizer)
 * Extract data from certifications, invoices, and documents
 * 
 * Resource: greenchainz-content-intel
 * Location: East US
 */

const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { azureConfig } = require('../config/azure');
const { keyVaultService } = require('./azureKeyVault');

class AzureDocumentIntelligenceService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.config = azureConfig.documentIntelligence;
  }

  /**
   * Initialize Document Intelligence client
   */
  async init() {
    if (!this.config.enabled) {
      console.log('[DocIntel] Document Intelligence is disabled');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      let apiKey = this.config.apiKey;
      
      // Try to get from Key Vault if not in config
      if (!apiKey) {
        apiKey = await keyVaultService.getSecret('document-intelligence-key');
      }

      if (!apiKey) {
        console.error('[DocIntel] No API key found');
        return false;
      }

      const credential = new AzureKeyCredential(apiKey);
      this.client = new DocumentAnalysisClient(this.config.endpoint, credential);
      
      this.isInitialized = true;
      console.log('[DocIntel] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[DocIntel] Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Analyze document with general document model
   */
  async analyzeDocument(documentBuffer, contentType = 'application/pdf') {
    if (!this.isInitialized) {
      throw new Error('Document Intelligence not initialized');
    }

    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-document',
        documentBuffer,
        { contentType }
      );

      const result = await poller.pollUntilDone();
      
      return {
        content: result.content,
        pages: result.pages,
        tables: result.tables,
        keyValuePairs: result.keyValuePairs,
        entities: result.entities
      };
    } catch (error) {
      console.error('[DocIntel] Error analyzing document:', error.message);
      throw error;
    }
  }

  /**
   * Extract text from certification documents (FSC, LEED, etc.)
   */
  async extractCertificationData(documentBuffer, certificationType) {
    if (!this.isInitialized) {
      throw new Error('Document Intelligence not initialized');
    }

    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-document',
        documentBuffer
      );

      const result = await poller.pollUntilDone();
      
      // Extract common certification fields
      const extractedData = {
        certificationType,
        rawText: result.content,
        certificationNumber: null,
        issueDate: null,
        expiryDate: null,
        holder: null,
        issuer: null,
        confidence: 0
      };

      // Parse key-value pairs
      if (result.keyValuePairs) {
        for (const pair of result.keyValuePairs) {
          const key = pair.key?.content?.toLowerCase() || '';
          const value = pair.value?.content || '';

          if (key.includes('certificate') && key.includes('number')) {
            extractedData.certificationNumber = value;
            extractedData.confidence += pair.confidence || 0;
          } else if (key.includes('issue') && key.includes('date')) {
            extractedData.issueDate = value;
            extractedData.confidence += pair.confidence || 0;
          } else if (key.includes('expir') || key.includes('valid until')) {
            extractedData.expiryDate = value;
            extractedData.confidence += pair.confidence || 0;
          } else if (key.includes('holder') || key.includes('company name')) {
            extractedData.holder = value;
            extractedData.confidence += pair.confidence || 0;
          } else if (key.includes('issuer') || key.includes('issued by')) {
            extractedData.issuer = value;
            extractedData.confidence += pair.confidence || 0;
          }
        }

        // Average confidence
        extractedData.confidence = extractedData.confidence / result.keyValuePairs.length;
      }

      return extractedData;
    } catch (error) {
      console.error('[DocIntel] Error extracting certification data:', error.message);
      throw error;
    }
  }

  /**
   * Analyze invoice
   */
  async analyzeInvoice(documentBuffer) {
    if (!this.isInitialized) {
      throw new Error('Document Intelligence not initialized');
    }

    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-invoice',
        documentBuffer
      );

      const result = await poller.pollUntilDone();
      
      const invoices = [];
      for (const document of result.documents || []) {
        const invoice = {
          invoiceId: document.fields['InvoiceId']?.value,
          invoiceDate: document.fields['InvoiceDate']?.value,
          dueDate: document.fields['DueDate']?.value,
          vendorName: document.fields['VendorName']?.value,
          vendorAddress: document.fields['VendorAddress']?.value,
          customerName: document.fields['CustomerName']?.value,
          customerAddress: document.fields['CustomerAddress']?.value,
          subtotal: document.fields['SubTotal']?.value,
          totalTax: document.fields['TotalTax']?.value,
          invoiceTotal: document.fields['InvoiceTotal']?.value,
          items: []
        };

        // Extract line items
        const items = document.fields['Items']?.value || [];
        for (const item of items) {
          invoice.items.push({
            description: item.properties['Description']?.value,
            quantity: item.properties['Quantity']?.value,
            unitPrice: item.properties['UnitPrice']?.value,
            amount: item.properties['Amount']?.value,
            productCode: item.properties['ProductCode']?.value
          });
        }

        invoices.push(invoice);
      }

      return invoices;
    } catch (error) {
      console.error('[DocIntel] Error analyzing invoice:', error.message);
      throw error;
    }
  }

  /**
   * Extract tables from document
   */
  async extractTables(documentBuffer) {
    if (!this.isInitialized) {
      throw new Error('Document Intelligence not initialized');
    }

    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-document',
        documentBuffer
      );

      const result = await poller.pollUntilDone();
      
      const tables = [];
      for (const table of result.tables || []) {
        const tableData = {
          rowCount: table.rowCount,
          columnCount: table.columnCount,
          cells: []
        };

        for (const cell of table.cells) {
          tableData.cells.push({
            rowIndex: cell.rowIndex,
            columnIndex: cell.columnIndex,
            content: cell.content,
            rowSpan: cell.rowSpan,
            columnSpan: cell.columnSpan
          });
        }

        tables.push(tableData);
      }

      return tables;
    } catch (error) {
      console.error('[DocIntel] Error extracting tables:', error.message);
      throw error;
    }
  }

  /**
   * Analyze receipt
   */
  async analyzeReceipt(documentBuffer) {
    if (!this.isInitialized) {
      throw new Error('Document Intelligence not initialized');
    }

    try {
      const poller = await this.client.beginAnalyzeDocument(
        'prebuilt-receipt',
        documentBuffer
      );

      const result = await poller.pollUntilDone();
      
      const receipts = [];
      for (const document of result.documents || []) {
        receipts.push({
          merchantName: document.fields['MerchantName']?.value,
          merchantAddress: document.fields['MerchantAddress']?.value,
          merchantPhoneNumber: document.fields['MerchantPhoneNumber']?.value,
          transactionDate: document.fields['TransactionDate']?.value,
          transactionTime: document.fields['TransactionTime']?.value,
          total: document.fields['Total']?.value,
          subtotal: document.fields['Subtotal']?.value,
          tax: document.fields['TotalTax']?.value,
          items: document.fields['Items']?.value || []
        });
      }

      return receipts;
    } catch (error) {
      console.error('[DocIntel] Error analyzing receipt:', error.message);
      throw error;
    }
  }

  /**
   * Custom certification parsers
   */
  async parseFSCCertificate(documentBuffer) {
    const data = await this.extractCertificationData(documentBuffer, 'FSC');
    
    // FSC-specific parsing logic
    const fscPattern = /FSC[- ]?C\d{6}/i;
    const match = data.rawText.match(fscPattern);
    if (match) {
      data.certificationNumber = match[0];
    }
    
    return data;
  }

  async parseLEEDCertificate(documentBuffer) {
    const data = await this.extractCertificationData(documentBuffer, 'LEED');
    
    // LEED-specific parsing logic
    const leedLevels = ['Certified', 'Silver', 'Gold', 'Platinum'];
    for (const level of leedLevels) {
      if (data.rawText.includes(level)) {
        data.certificationLevel = level;
        break;
      }
    }
    
    return data;
  }

  async parseEPDCertificate(documentBuffer) {
    return await this.extractCertificationData(documentBuffer, 'EPD');
  }
}

// Export singleton instance
const documentIntelligenceService = new AzureDocumentIntelligenceService();

module.exports = {
  documentIntelligenceService,
  AzureDocumentIntelligenceService
};
