// test-env.js
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('============================');
console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
console.log('MONGODB_URI starts with mongodb?', process.env.MONGODB_URI?.startsWith('mongodb'));

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  console.log('URI format check:');
  console.log('  - Starts with mongodb+srv://?', uri.startsWith('mongodb+srv://'));
  console.log('  - Has @ symbol?', uri.includes('@'));
  console.log('  - Has database name?', uri.includes('/greenchainz'));
  console.log('  - Length:', uri.length, 'chars');
  console.log('  - First 30 chars:', uri.substring(0, 30) + '...');
} else {
  console.log('❌ MONGODB_URI is NOT SET in .env.local');
  console.log('\nAdd this line to .env.local:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenchainz');
}
