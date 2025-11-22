const fetch = require('node-fetch'); // Fallback if global fetch is missing, but we expect Node 18+

/**
 * Subscribe a user to the MailerLite newsletter
 * @param {string} email - The email address to subscribe
 * @returns {Promise<Object>} - The response from MailerLite
 */
async function subscribeToNewsletter(email) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ MAILERLITE_API_KEY is missing. Skipping newsletter subscription.');
    return { skipped: true, message: 'API key missing' };
  }

  try {
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email: email,
        groups: process.env.MAILERLITE_GROUP_ID ? [process.env.MAILERLITE_GROUP_ID] : []
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to subscribe');
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error('❌ Newsletter subscription failed:', error.message);
    throw error;
  }
}

module.exports = { subscribeToNewsletter };
