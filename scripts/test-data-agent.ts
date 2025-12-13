
import { fetchSustainabilityData } from '@/lib/agents/data-aggregation';

async function run() {
  console.log('Testing Data Aggregation Agent...');

  // Test case 1: Common material
  console.log('\n--- Test 1: Concrete ---');
  const concreteData = await fetchSustainabilityData('Low Carbon Concrete', 'Concrete');
  console.log('Result:', JSON.stringify(concreteData, null, 2));

  // Test case 2: Wood (FSC check)
  console.log('\n--- Test 2: Plywood ---');
  const woodData = await fetchSustainabilityData('Birch Plywood', 'Wood');
  console.log('Result:', JSON.stringify(woodData, null, 2));

  console.log('\nDone.');
}

run().catch(console.error);
