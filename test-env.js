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
