import React from 'react';
import { Html, Head, Preview, Body, Container, Section } from '@react-email/components';
import { EmailHeader } from './EmailHeader';
import { EmailFooter } from './EmailFooter';

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({ previewText, children }) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />
          <Section style={contentSection}>
            {children}
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

const bodyStyle = {
  backgroundColor: '#F3F4F6',
  padding: '20px 0',
};

const containerStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};

const contentSection = {
  padding: '30px 40px',
};

export default EmailLayout;
