import React from 'react';
import { Text, Heading } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  resetLink,
}) => {
  return (
    <EmailLayout previewText="Password Reset Request - Me Nestham">
      <Heading style={headingStyle}>Reset Your Password</Heading>
      <Text style={textStyle}>
        We received a request to reset your password for your Me Nestham account. Click the button below to secure your account and set a new password:
      </Text>

      <EmailButton href={resetLink}>
        Reset Password
      </EmailButton>

      <Text style={textStyle}>
        This link is valid for 1 hour. If you did not make this request, you can safely ignore this email and your password will remain unchanged.
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

export default PasswordResetEmail;
