// backend/services/dataScoutService.js
const EPDInternationalProvider = require('../providers/epdInternational');
const EC3Provider = require('../providers/ec3');
const ECOPlatformProvider = require('../providers/ecoPlatform');

class DataScoutService {
  constructor() {
    this.providers = [
      new EPDInternationalProvider(),
      new EC3Provider(),
      new ECOPlatformProvider()
    ];
  }

  /**
   * Aggregate search across all providers
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Aggregated and validated results
   */
  async aggregateSearch(query) {
    console.log(`[Data Scout] Starting aggregation for: "${query}"`);
    
    // 1. Search all providers in parallel
    const searchPromises = this.providers.map(provider => 
      provider.search(query).catch(err => {
        console.error(`[Data Scout] Error from ${provider.name}:`, err);
        return []; // Return empty array on error to keep other results
      })
    );

    const results = await Promise.all(searchPromises);
    
    // Flatten results
    const allRecords = results.flat();
    console.log(`[Data Scout] Found ${allRecords.length} total records before deduplication`);

    // 2. Deduplicate and Prioritize
    // Map of epd_number -> record
    const uniqueRecords = new Map();

    // Sort providers by priority (1 is highest) to ensure high priority overwrites low priority
    // Actually, we want to process lower priority first, so higher priority overwrites
    // OR process in order and only add if not exists.
    // Let's do: Process all, if collision, keep the one from higher priority provider.
    
    // First, map provider name to priority for easy lookup
    const providerPriority = {};
    this.providers.forEach(p => providerPriority[p.name] = p.priority);

    allRecords.forEach(record => {
      const existing = uniqueRecords.get(record.epd_number);
      
      if (!existing) {
        uniqueRecords.set(record.epd_number, record);
      } else {
        // Conflict resolution
        const existingPriority = providerPriority[existing.verified_by] || 99; // Default low priority if unknown
        // Note: verified_by might not match provider name exactly in real data, 
        // but for this mock implementation we can infer or use a separate 'provider_source' field if we added it.
        // For now, let's assume the mock data 'verified_by' maps closely enough or we rely on the order we process.
        
        // Better approach: Add metadata to record about which provider it came from during search
        // But since we don't want to modify the record structure returned to user too much, let's just use the list order.
        // We can sort the allRecords by provider priority before iterating.
      }
    });

    // To properly handle priority:
    // 1. Assign priority to each record based on which provider returned it.
    //    (Since we flattened the array, we lost that context unless we attach it).
    //    Let's re-do the flattening to keep context.
    
    const prioritizedRecords = [];
    results.forEach((providerResults, index) => {
      const provider = this.providers[index];
      providerResults.forEach(record => {
        prioritizedRecords.push({
          ...record,
          _providerPriority: provider.priority
        });
      });
    });

    // Sort by priority (ascending: 1, 2, 3...)
    prioritizedRecords.sort((a, b) => a._providerPriority - b._providerPriority);

    const finalMap = new Map();
    prioritizedRecords.forEach(record => {
      // Since we sorted by priority (1 is best), we want the FIRST one we see to stick?
      // No, if we iterate 1, 2, 3... 
      // If we see 1, put it in.
      // If we see 2 and it has same ID, ignore it (because 1 is better).
      
      if (!finalMap.has(record.epd_number)) {
        // Remove internal metadata before returning
        const { _providerPriority, ...cleanRecord } = record;
        finalMap.set(record.epd_number, cleanRecord);
      }
    });

    const uniqueList = Array.from(finalMap.values());

    // 3. Validate Certifications
    const validatedList = uniqueList.map(record => this.validateRecord(record));

    return validatedList;
  }

  /**
   * Validate a single record
   * @param {Object} record 
   */
  validateRecord(record) {
    const now = new Date();
    const validEnd = new Date(record.validity_end);
    const isExpired = now > validEnd;

    // Add validation warnings if needed
    if (isExpired) {
      if (!record.warnings) record.warnings = [];
      record.warnings.push("Certification has expired");
    }

    return record;
  }
}

module.exports = new DataScoutService();
