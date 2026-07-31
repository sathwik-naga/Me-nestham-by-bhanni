import React from 'react';
import { Button } from '@react-email/components';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export const EmailButton: React.FC<EmailButtonProps> = ({ href, children }) => {
  return (
    <Button style={buttonStyle} href={href}>
      {children}
    </Button>
  );
};

const buttonStyle = {
  backgroundColor: '#1E1B4B',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '13px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  margin: '25px auto',
  padding: '12px 20px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

export default EmailButton;
