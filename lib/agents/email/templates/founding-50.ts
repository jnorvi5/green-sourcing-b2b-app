export const FOUNDING_50_TEMPLATE = {
    subject: (companyName: string) =>
        `Partnership Opportunity: ${companyName} x GreenChainz`,

    body: (params: {
        firstName: string;
        companyName: string;
        specificProduct?: string;
    }) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Hi ${params.firstName},</p>
      
      <p>I'm Jerit, founder of <strong>GreenChainz</strong>—the B2B marketplace connecting verified sustainable building materials suppliers with architects who are tired of endless RFQs and manual EPD verification.</p>
      
      <p>We're building our <strong>Founding 50</strong> supplier cohort for our Q1 2026 launch, and ${params.companyName} is exactly the type of partner we want.</p>
      
      <p><strong>What you get:</strong></p>
      <ul>
        <li>Zero commission first 6 months</li>
        <li>Priority placement in search results</li>
        <li>Direct RFQ routing from 200+ architects</li>
        <li>AI-powered sustainability audit (free)</li>
      </ul>
      
      <p><strong>What we need:</strong> 15 min call to verify your EPD documentation and set up your dashboard.</p>
      
      <p>Interested? Reply with your availability this week.</p>
      
      <p>Best,<br>
      Jerit Norville<br>
      Founder & CEO, GreenChainz<br>
      <a href="https://greenchainz.com">greenchainz.com</a></p>
    </body>
    </html>
  `
};

export const FOLLOW_UP_TEMPLATE = {
    subject: 'Following up: GreenChainz Founding 50',
    body: (firstName: string) => `
    <p>Hi ${firstName},</p>
    <p>Following up on my email from last week about joining our Founding 50 supplier program.</p>
    <p>Quick reminder of the benefits:</p>
    <ul>
      <li>6 months commission-free</li>
      <li>Early access to 200+ architects</li>
      <li>Priority search placement</li>
    </ul>
    <p>Still interested in a quick 15 min call?</p>
    <p>Best,<br>Jerit</p>
  `
};
