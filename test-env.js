// test-env.js
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('============================');
console.log('NEXT_PUBLIC_SUPABASE_URL exists?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('AWS_BUCKET_NAME exists?', !!process.env.AWS_BUCKET_NAME);
console.log('RESEND_API_KEY exists?', !!process.env.RESEND_API_KEY);
console.log('NEXT_PUBLIC_INTERCOM_APP_ID exists?', !!process.env.NEXT_PUBLIC_INTERCOM_APP_ID);

console.log('\n✅ Environment check complete (MongoDB removed)');
