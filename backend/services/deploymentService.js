const fs = require('fs').promises;
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '../config/deploymentManifest.json');
const AGENT_JULES = 'JULES';

class DeploymentService {
  constructor() {
    this.writeLock = {
      holder: null,
      timestamp: 0
    };
    this.lockTimeout = 5000; // 5 seconds lock timeout
  }

  async getManifest() {
    try {
      const data = await fs.readFile(MANIFEST_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading manifest:', error);
      return { deployments: [], version: '1.0.0' };
    }
  }

  async saveManifest(manifest) {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  }

  /**
   * Request to write to the deployment manifest.
   * @param {string} agentId - The ID of the agent requesting the write.
   * @param {object} change - The change to apply (e.g., new deployment object).
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async requestWrite(agentId, change) {
    const now = Date.now();

    // Clean up expired locks
    if (this.writeLock.holder && (now - this.writeLock.timestamp > this.lockTimeout)) {
      console.log(`[DeploymentService] Lock held by ${this.writeLock.holder} expired.`);
      this.writeLock.holder = null;
    }

    // Conflict Resolution Logic
    if (agentId === AGENT_JULES) {
      // JULES Priority: Always take the lock, even if currently held
      if (this.writeLock.holder && this.writeLock.holder !== AGENT_JULES) {
        console.log(`[DeploymentService] JULES overriding lock held by ${this.writeLock.holder}`);
      }
      this.writeLock = { holder: AGENT_JULES, timestamp: now };
    } else {
      // Standard Agent: Check for existing lock
      if (this.writeLock.holder && this.writeLock.holder !== agentId) {
        return { 
          success: false, 
          message: `Conflict: Write lock currently held by ${this.writeLock.holder}. Priority to JULES.` 
        };
      }
      // Acquire lock
      this.writeLock = { holder: agentId, timestamp: now };
    }

    // Perform the write operation
    try {
      const manifest = await this.getManifest();
      
      // Simulate processing time to demonstrate lock holding
      // await new Promise(resolve => setTimeout(resolve, 100));

      manifest.deployments.push({
        ...change,
        deployedBy: agentId,
        timestamp: new Date().toISOString()
      });
      manifest.lastUpdated = new Date().toISOString();

      await this.saveManifest(manifest);
      
      // Release lock
      this.writeLock.holder = null;
      
      return { success: true, message: 'Deployment recorded successfully.' };

    } catch (error) {
      this.writeLock.holder = null; // Ensure lock is released on error
      return { success: false, message: `Write failed: ${error.message}` };
    }
  }
}

module.exports = new DeploymentService();
