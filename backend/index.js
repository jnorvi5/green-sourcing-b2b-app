// ADD THIS TO EXISTING backend/index.js

// Import auto-profile routes
const autoProfileRoutes = require('./routes/autoProfile');

// Register routes (add this with other route registrations)
app.use('/api/auto-profile', autoProfileRoutes);

// Initialize auto-profile generator on startup
const autoProfileGenerator = require('./services/autoProfileGenerator');
autoProfileGenerator.initialize().catch(err => {
  console.error('[AutoProfile] Initialization failed:', err);
});
