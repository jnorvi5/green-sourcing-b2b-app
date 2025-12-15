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

interface QuoteReceivedNotificationProps {
  buyerName: string;
  productName: string;
  supplierName: string;
  quoteAmount: string;
  quoteMessage: string;
  dashboardUrl: string;
}

export default function QuoteReceivedNotification({
  buyerName = 'Buyer',
  productName = 'Sustainable Insulation',
  supplierName = 'EcoMaterials Inc.',
  quoteAmount = '$5,000',
  quoteMessage = 'We can deliver by next Tuesday.',
  dashboardUrl = 'https://greenchainz.com/dashboard/buyer/quotes',
}: QuoteReceivedNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New Quote Received: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          <Section style={content}>
            <Heading style={h1}>New Quote Received</Heading>

            <Text style={paragraph}>
              Hi {buyerName},
            </Text>

            <Text style={paragraph}>
              Good news! <strong>{supplierName}</strong> has sent a quote for your request: <strong>{productName}</strong>.
            </Text>

            <Section style={detailsSection}>
              <Text style={detailsHeader}>--- Quote Summary ---</Text>
              <Text><strong>Supplier:</strong> {supplierName}</Text>
              <Text><strong>Amount:</strong> {quoteAmount}</Text>
              <Text><strong>Message:</strong> "{quoteMessage}"</Text>
            </Section>

            <Text style={paragraph}>
              Review the full quote details and accept it on your dashboard.
            </Text>

            <EmailButton href={dashboardUrl}>
              View Quote
            </EmailButton>

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

const detailsSection = {
  backgroundColor: '#F1F5F9',
  padding: '16px',
  borderRadius: '8px',
  margin: '16px 0',
};

const detailsHeader = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#0F172A',
  margin: '0 0 8px',
};
