import React from 'react';
import { Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface ContactAdminAlertEmailProps {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const ContactAdminAlertEmail: React.FC<ContactAdminAlertEmailProps> = ({
  name,
  email,
  phone,
  subject,
  message,
}) => {
  return (
    <EmailLayout previewText={`New Contact Message: ${subject}`}>
      <Heading style={headingStyle}>New Contact Form Submission</Heading>
      <Text style={textStyle}>
        <strong>Name:</strong> {name}<br />
        <strong>Email:</strong> {email}<br />
        <strong>Phone:</strong> {phone}<br />
        <strong>Subject:</strong> {subject}
      </Text>
      <Text style={labelStyle}>Message:</Text>
      <div style={messageBoxStyle}>
        <Text style={messageTextStyle}>{message}</Text>
      </div>
      <Text style={signatureStyle}>
        Logged in Admin Portal &bull; Me Nestham by Bhanni
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

const labelStyle = {
  color: '#1F2937',
  fontSize: '14px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontWeight: 'bold',
  margin: '15px 0 5px',
};

const messageBoxStyle = {
  backgroundColor: '#F3F4F6',
  borderRadius: '8px',
  padding: '16px',
  borderLeft: '4px solid #E8873A',
  margin: '10px 0 20px',
};

const messageTextStyle = {
  color: '#1F2937',
  fontSize: '13px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  lineHeight: '20px',
  margin: 0,
  whiteSpace: 'pre-wrap',
};

const signatureStyle = {
  color: '#9CA3AF',
  fontSize: '12px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  marginTop: '25px',
};

export default ContactAdminAlertEmail;
