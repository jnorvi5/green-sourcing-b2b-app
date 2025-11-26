class BudgetService {
  constructor() {
    this.dailyLimit = 3.30; // $100 / 30 days
    this.currentSpend = 0.0;
    this.isSuspended = false;
  }

  /**
   * Updates the current spend. In a real scenario, this would fetch from an API.
   * @param {number} amount - Amount to add to current spend.
   */
  trackSpend(amount) {
    this.currentSpend += amount;
    this.checkBudget();
  }

  /**
   * Sets the current spend directly (for testing/mocking).
   * @param {number} amount 
   */
  setSpend(amount) {
    this.currentSpend = amount;
    this.checkBudget();
  }

  /**
   * Checks if the daily limit has been exceeded.
   * If so, suspends non-critical processes.
   */
  checkBudget() {
    if (this.currentSpend > this.dailyLimit) {
      if (!this.isSuspended) {
        this.suspendNonCriticalProcesses();
      }
    } else {
      if (this.isSuspended) {
        this.resumeProcesses();
      }
    }
  }

  suspendNonCriticalProcesses() {
    console.warn(`[Budget Watchdog] ⚠️ DAILY SPEND LIMIT EXCEEDED ($${this.currentSpend.toFixed(2)} > $${this.dailyLimit}). Suspending non-critical processes.`);
    this.isSuspended = true;
    // Logic to actually stop processes would go here (e.g., emitting an event)
  }

  resumeProcesses() {
    console.log(`[Budget Watchdog] ✅ Spend within limits. Resuming processes.`);
    this.isSuspended = false;
  }

  getStatus() {
    return {
      currentSpend: this.currentSpend,
      dailyLimit: this.dailyLimit,
      isSuspended: this.isSuspended
    };
  }
}

module.exports = new BudgetService();
