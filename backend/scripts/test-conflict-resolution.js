const deploymentService = require('../services/deploymentService');

async function testConflictResolution() {
  console.log('--- Starting Conflict Resolution Test ---\n');

  // Scenario 1: Standard Agent Write
  console.log('1. Agent A requests write...');
  const res1 = await deploymentService.requestWrite('Agent-A', { id: 'dep-001', status: 'pending' });
  console.log('Agent A Result:', res1);

  // Scenario 2: Concurrent Write Conflict (Simulated)
  console.log('\n2. Simulating Conflict: Agent B tries to write while Agent A holds lock (simulated manually for test)');
  // Manually set lock to Agent A to simulate concurrent access
  deploymentService.writeLock = { holder: 'Agent-A', timestamp: Date.now() };
  
  const res2 = await deploymentService.requestWrite('Agent-B', { id: 'dep-002', status: 'pending' });
  console.log('Agent B Result (should fail):', res2);

  // Scenario 3: JULES Priority Override
  console.log('\n3. JULES Priority: JULES tries to write while Agent A holds lock');
  // Lock still held by Agent A from previous step
  const res3 = await deploymentService.requestWrite('JULES', { id: 'dep-jules-001', status: 'critical' });
  console.log('JULES Result (should succeed):', res3);

  // Scenario 4: Agent A tries to write while JULES holds lock
  console.log('\n4. Agent A tries to write while JULES holds lock (simulated)');
  deploymentService.writeLock = { holder: 'JULES', timestamp: Date.now() };
  const res4 = await deploymentService.requestWrite('Agent-A', { id: 'dep-003', status: 'pending' });
  console.log('Agent A Result (should fail):', res4);

  console.log('\n--- Test Complete ---');
}

testConflictResolution();
