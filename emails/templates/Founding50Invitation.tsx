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

interface Founding50InvitationProps {
  name: string;
  role: string;
  companyName: string;
  category: string;
  certification: string;
  applyUrl: string;
  senderName: string;
}

export default function Founding50Invitation({
  name = 'Partner',
  role = 'Head of Sustainability',
  companyName = 'EcoMaterials Inc.',
  category = 'sustainable insulation',
  certification = 'EPD and FSC',
  applyUrl = 'https://greenchainz.com/founding-50',
  senderName = 'Jules',
}: Founding50InvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>Invitation: Join the "Founding 50" Sustainable Manufacturers (GreenChainz)</Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />

          <Section style={content}>
            <Heading style={h1}>Invitation: Join the "Founding 50"</Heading>

            <Text style={paragraph}>
              Hi {name},
            </Text>

            <Text style={paragraph}>
              I'm reaching out because <strong>{companyName}</strong> is a leader in <strong>{category}</strong>, and I want to invite you to be part of something that will change how architects source green materials.
            </Text>

            <Text style={paragraph}>
              I'm building <strong>GreenChainz</strong>, a verified B2B marketplace designed to solve the biggest headache for architects: finding and specifying trustworthy, low-carbon materials without hours of research.
            </Text>

            <Text style={paragraph}>
              We are currently hand-selecting our <strong>"Founding 50" suppliers</strong>—a curated group of top-tier manufacturers to launch the platform with. I'd love for <strong>{companyName}</strong> to be one of them.
            </Text>

            <Section style={highlightSection}>
              <Text style={highlightHeader}>Why join the Founding 50?</Text>
              <ul style={list}>
                <li style={listItem}><strong>Lifetime "Founding Partner" Badge:</strong> Permanent recognition on your profile as a platform pioneer.</li>
                <li style={listItem}><strong>Zero Fees for 6 Months:</strong> Keep 100% of revenue. No commissions or lead fees.</li>
                <li style={listItem}><strong>Priority Search Placement:</strong> Your products will be prioritized in search results during our launch phase.</li>
                <li style={listItem}><strong>Direct Product Input:</strong> Help shape the platform to fit your sales workflow perfectly.</li>
              </ul>
            </Section>

            <Text style={paragraph}>
              We are looking for partners like <strong>{companyName}</strong> who have verified certifications (like your <strong>{certification}</strong>) and are ready to connect directly with specifiers.
            </Text>

            <Text style={paragraph}>
              <strong>We are accepting applications until December 15th.</strong>
            </Text>

            <EmailButton href={applyUrl}>
              View Details & Apply
            </EmailButton>

            <Text style={paragraph}>
              Are you open to a 10-minute chat this week to discuss how this can drive more qualified leads to your sales team?
            </Text>

            <Text style={paragraph}>
              Best regards,
              <br />
              <strong>{senderName}</strong>
              <br />
              Founder, GreenChainz
              <br />
              <Link href="https://greenchainz.com" style={link}>greenchainz.com</Link>
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

const highlightSection = {
  backgroundColor: '#F0FDF4', // Light green background
  border: '1px solid #BBF7D0',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
};

const highlightHeader = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#166534',
  margin: '0 0 12px',
};

const list = {
  paddingLeft: '20px',
  margin: '0',
};

const listItem = {
  color: '#020617',
  fontSize: '15px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const link = {
  color: '#1F9D55',
  textDecoration: 'underline',
};
