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

interface QuoteAcceptedNotificationProps {
  supplierName: string;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  dashboardUrl: string;
}

export default function QuoteAcceptedNotification({
  supplierName = 'Supplier',
  productName = 'Sustainable Insulation',
  buyerName = 'Buyer Co.',
  buyerEmail = 'buyer@example.com',
  dashboardUrl = 'https://greenchainz.com/dashboard/supplier/orders',
}: QuoteAcceptedNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Quote Accepted: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          <Section style={content}>
            <Heading style={h1}>Quote Accepted! 🎉</Heading>

            <Text style={paragraph}>
              Hi {supplierName},
            </Text>

            <Text style={paragraph}>
              Great news! <strong>{buyerName}</strong> has accepted your quote for <strong>{productName}</strong>.
            </Text>

            <Section style={detailsSection}>
              <Text style={detailsHeader}>--- Next Steps ---</Text>
              <Text style={paragraph}>
                Please reach out to the buyer directly to finalize payment and delivery details.
              </Text>
              <Text><strong>Buyer Contact:</strong> {buyerEmail}</Text>
            </Section>

            <EmailButton href={`mailto:${buyerEmail}`}>
              Email Buyer
            </EmailButton>

            <Text style={paragraph}>
                You can also view the order details on your dashboard.
            </Text>

            <Text style={paragraph}>
              <Link href={dashboardUrl} style={link}>View Order on Dashboard</Link>
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

const detailsSection = {
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  padding: '16px',
  borderRadius: '8px',
  margin: '16px 0',
};

const detailsHeader = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#166534',
  margin: '0 0 8px',
};

const link = {
  color: '#1F9D55',
  textDecoration: 'underline',
};
