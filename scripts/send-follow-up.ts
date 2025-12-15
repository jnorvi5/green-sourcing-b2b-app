import 'dotenv/config'; // Load env vars
import { sendEmail } from '../lib/email/sender';
import TransactionFollowUp from '../emails/templates/TransactionFollowUp';

async function main() {
  console.log('🚀 Starting Transaction Follow-up Check...');

  // In a real scenario, this would query the database for transactions completed 30 days ago.
  // For this demo, we'll mock a transaction.

  const mockTransactions = [
    {
      id: 'tx_12345',
      buyerName: 'Alice Architect',
      buyerEmail: 'alice@example.com',
      productName: 'Recycled Steel Beams',
      transactionDate: '2023-10-15', // 30 days ago approx
    }
  ];

  console.log(`📋 Found ${mockTransactions.length} transactions requiring follow-up.`);

  for (const tx of mockTransactions) {
    console.log(`\n📧 Sending follow-up to ${tx.buyerName} for ${tx.productName}...`);

    try {
      const result = await sendEmail({
        to: tx.buyerEmail,
        subject: `Checking in on your order: ${tx.productName}`,
        react: TransactionFollowUp({
          userName: tx.buyerName,
          productName: tx.productName,
          transactionDate: tx.transactionDate,
          feedbackUrl: `https://greenchainz.com/feedback/${tx.id}`,
        }),
      });

      if (result.success) {
        console.log(`✅ Sent successfully! Message ID: ${result.messageId}`);
      } else {
        console.error(`❌ Failed to send: ${result.error}`);
      }

    } catch (error) {
      console.error(`❌ Unexpected error:`, error);
    }
  }
}

main().catch(console.error);
