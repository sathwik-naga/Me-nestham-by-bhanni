import React from 'react';
import { Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface CustomerContactConfirmationEmailProps {
  customerName: string;
}

export const CustomerContactConfirmationEmail: React.FC<CustomerContactConfirmationEmailProps> = ({ customerName }) => {
  return (
    <EmailLayout previewText="We've received your message - Me Nestham by Bhanni">
      <Heading style={headingStyle}>Thank You, {customerName}!</Heading>
      <Text style={textStyle}>
        Hi {customerName},
      </Text>
      <Text style={textStyle}>
        Thank you for contacting <strong>Me Nestham by Bhanni</strong>.
      </Text>
      <Text style={textStyle}>
        We have received your message and our customer support team will review your inquiry and reply within 12–24 hours.
      </Text>
      <Text style={textStyle}>
        If you have any urgent updates regarding your order, feel free to reply directly to this email or reach us on WhatsApp at +91 99493 45197.
      </Text>
      <Text style={signatureStyle}>
        Warm regards,<br />
        <strong>Me Nestham by Bhanni Support Team</strong>
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

export default CustomerContactConfirmationEmail;
