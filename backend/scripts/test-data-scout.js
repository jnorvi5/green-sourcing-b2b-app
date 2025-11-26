// backend/scripts/test-data-scout.js
const dataScoutService = require('../services/dataScoutService');

async function runTests() {
  console.log('🧪 Starting Data Scout Tests...\n');

  // Test 1: Search for "steel" (Should return aggregated results from EPD Int and EC3)
  console.log('Test 1: Search for "steel"');
  const steelResults = await dataScoutService.aggregateSearch('steel');
  console.log(`Found ${steelResults.length} results.`);
  if (steelResults.length > 0) {
    console.log('Sample result:', JSON.stringify(steelResults[0], null, 2));
  } else {
    console.error('❌ No results found for "steel"');
  }
  console.log('\n-----------------------------------\n');

  // Test 2: Search for "wood" (Should return ECO Platform result)
  console.log('Test 2: Search for "wood"');
  const woodResults = await dataScoutService.aggregateSearch('wood');
  console.log(`Found ${woodResults.length} results.`);
  if (woodResults.length > 0) {
    console.log('Sample result:', JSON.stringify(woodResults[0], null, 2));
  } else {
    console.error('❌ No results found for "wood"');
  }
  console.log('\n-----------------------------------\n');

  // Test 3: Search for unknown product
  console.log('Test 3: Search for "unobtanium"');
  const unknownResults = await dataScoutService.aggregateSearch('unobtanium');
  console.log(`Found ${unknownResults.length} results.`);
  if (unknownResults.length === 0) {
    console.log('✅ Correctly found 0 results.');
  } else {
    console.error('❌ Unexpected results found');
  }
}

runTests().catch(console.error);
