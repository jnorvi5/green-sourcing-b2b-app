import 'dotenv/config'; // Load env vars
import { sendEmail } from '../lib/email/sender';
import Founding50Invitation from '../emails/templates/Founding50Invitation';
import * as fs from 'fs';
import * as path from 'path';

// Define the recipient interface
interface Recipient {
  name: string;
  role: string;
  companyName: string;
  email: string;
  category: string;
  certification: string;
}

async function main() {
  console.log('🚀 Starting Founding 50 Campaign Outreach...');

  // Read recipients from JSON file
  const jsonPath = path.join(process.cwd(), 'campaigns/founding-50/example-companies.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Recipient file not found at ${jsonPath}`);
    process.exit(1);
  }

  const recipients: Recipient[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📋 Found ${recipients.length} recipients to contact.`);

  let successCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    console.log(`\n📧 Sending invitation to ${recipient.name} at ${recipient.companyName}...`);

    try {
      const result = await sendEmail({
        to: recipient.email,
        subject: `Invitation: Join the "Founding 50" Sustainable Manufacturers (GreenChainz)`,
        react: Founding50Invitation({
          name: recipient.name,
          role: recipient.role,
          companyName: recipient.companyName,
          category: recipient.category,
          certification: recipient.certification,
          applyUrl: 'https://greenchainz.com/founding-50',
          senderName: 'Your Name', // Configure this
        }),
      });

      if (result.success) {
        console.log(`✅ Sent successfully! Message ID: ${result.messageId}`);
        successCount++;
      } else {
        console.error(`❌ Failed to send: ${result.error}`);
        failCount++;
      }

      // Add a small delay to avoid rate limits (if any)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Unexpected error for ${recipient.email}:`, error);
      failCount++;
    }
  }

  console.log('\n-----------------------------------');
  console.log('🎉 Campaign Run Complete');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('-----------------------------------');
}

main().catch(console.error);
