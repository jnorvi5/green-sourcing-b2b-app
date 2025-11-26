const alertService = require('../services/alertService');

console.log('--- Testing Alert System ---');

// 1. Info Alert
console.log('\nTesting INFO alert...');
alertService.sendAlert('INFO', 'System operating normally.');

// 2. Downtime Alert (Red Flag)
console.log('\nTesting DOWNTIME alert...');
alertService.sendAlert('DOWNTIME', 'Main server is unresponsive.');
