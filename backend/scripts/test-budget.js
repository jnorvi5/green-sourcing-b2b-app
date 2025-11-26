const budgetService = require('../services/budgetService');

console.log('--- Testing Budget Watchdog ---');

// 1. Initial State
console.log('Initial Status:', budgetService.getStatus());

// 2. Add spend within limit
console.log('\nAdding $1.50 spend...');
budgetService.trackSpend(1.50);
console.log('Status:', budgetService.getStatus());

// 3. Exceed limit
console.log('\nAdding $2.00 spend (Total $3.50)...');
budgetService.trackSpend(2.00);
console.log('Status:', budgetService.getStatus());

// 4. Reset (simulating new day or manual reset)
console.log('\nResetting spend to $0...');
budgetService.setSpend(0);
console.log('Status:', budgetService.getStatus());
