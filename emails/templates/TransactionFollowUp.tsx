import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import EmailHeader from '../components/EmailHeader';
import EmailFooter from '../components/EmailFooter';
import EmailButton from '../components/EmailButton';

interface TransactionFollowUpProps {
  userName: string;
  transactionDate: string;
  productName: string;
  feedbackUrl: string;
}

export default function TransactionFollowUp({
  userName = 'Customer',
  transactionDate = 'October 15, 2023',
  productName = 'Sustainable Insulation',
  feedbackUrl = 'https://greenchainz.com/feedback',
}: TransactionFollowUpProps) {
  return (
    <Html>
      <Head />
      <Preview>How did your order go?</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          <Section style={content}>
            <Heading style={h1}>Checking In</Heading>

            <Text style={paragraph}>
              Hi {userName},
            </Text>

            <Text style={paragraph}>
              It's been about a month since your transaction for <strong>{productName}</strong> on {transactionDate}. We hope your project is coming along well!
            </Text>

            <Text style={paragraph}>
              We'd love to hear about your experience. Was the supplier easy to work with? Did the materials meet your expectations?
            </Text>

            <EmailButton href={feedbackUrl}>
              Leave Feedback
            </EmailButton>

             <Text style={paragraph}>
              Your feedback helps us maintain a high-quality marketplace for everyone.
            </Text>

            <Text style={paragraph}>
              Best,
              <br />
              The GreenChainz Team
            </Text>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const content = {
  padding: '24px',
};

const h1 = {
  color: '#020617',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#020617',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};
