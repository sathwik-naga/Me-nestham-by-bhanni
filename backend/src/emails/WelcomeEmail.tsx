import React from 'react';
import { Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface WelcomeEmailProps {
  fullName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ fullName }) => {
  return (
    <EmailLayout previewText="Welcome to Me Nestham!">
      <Heading style={headingStyle}>Welcome, {fullName}!</Heading>
      <Text style={textStyle}>
        Thank you for creating an account with Me Nestham. We are excited to bring you the best direct-to-consumer premium natural goods.
      </Text>
      <Text style={textStyle}>
        Discover our collection and experience authentic, healthy, and organic offerings designed for your well-being.
      </Text>
      <EmailButton href="http://localhost:5173/shop">
        Start Exploring
      </EmailButton>
      <Text style={textStyle}>
        If you ever need any assistance, our dedicated customer success team is here for you. Simply reply to this email!
      </Text>
      <Text style={signatureStyle}>
        Warmly,<br />
        <strong>The Me Nestham Team</strong>
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#1F2937',
  fontSize: '20px',
  fontFamily: 'Georgia, serif',
  fontWeight: 'bold',
  marginBottom: '20px',
};

const textStyle = {
  color: '#4B5563',
  fontSize: '14px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  lineHeight: '22px',
  margin: '0 0 15px',
};

const signatureStyle = {
  color: '#4B5563',
  fontSize: '14px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  lineHeight: '22px',
  marginTop: '25px',
  margin: '25px 0 0',
};

export default WelcomeEmail;
