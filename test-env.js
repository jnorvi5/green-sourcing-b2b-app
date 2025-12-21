// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';
process.env.NODE_ENV = 'test';
// Optional: extend Jest matchers
// import '@testing-library/jest-dom';

// Mock IntersectionObserver if needed (often required for some UI libraries)
if (typeof window !== 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(cb, options) {}
    observe() { return null; }
    disconnect() { return null; }
    unobserve() { return null; }
  };
}
// test-env.js
// Mock global variables or setups needed for tests
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
