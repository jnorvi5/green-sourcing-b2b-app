import { EmailAgent } from '../../lib/azure/emailer';

export default async function handler(req, res) {
  try {
    const agent = new EmailAgent();
    
    const email = await agent.generate("EPD International", [
      "Building B2B marketplace for verified green materials",
      "Need EPD data API for 500 architects",
      "Request 20-min call to discuss partnership"
    ]);

    return res.json({ 
      success: true, 
      email,
      cost: "~$0.0001 per email" 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message 
    });
  }
}
