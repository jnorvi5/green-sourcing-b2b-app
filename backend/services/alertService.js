class AlertService {
  constructor() {
    this.agentKing = 'AGENT KING';
  }

  /**
   * Sends an alert.
   * @param {string} type - 'DOWNTIME', 'INFO', 'WARNING'
   * @param {string} message - The alert message.
   */
  sendAlert(type, message) {
    const timestamp = new Date().toISOString();

    if (type === 'DOWNTIME') {
      const alert = `
🚨 **RED FLAG ALERT TO ${this.agentKing}** 🚨
STATUS: CRITICAL FAILURE
MESSAGE: ${message}
TIMESTAMP: ${timestamp}
`;
      console.error(alert);
      return alert;
    } else {
      const alert = `[${type}] ${message} (${timestamp})`;
      console.log(alert);
      return alert;
    }
  }
}

module.exports = new AlertService();
