import React from 'react';
import { Section, Text, Hr } from '@react-email/components';

export const EmailFooter: React.FC = () => {
  return (
    <Section style={footerSection}>
      <Hr style={divider} />
      <Text style={footerText}>
        © {new Date().getFullYear()} Me Nestham. All rights reserved.
      </Text>
      <Text style={footerSubtext}>
        You received this email because you are registered with Me Nestham.
        If you have any questions, reach out to our customer support team.
      </Text>
    </Section>
  );
};

const footerSection = {
  padding: '0 20px 30px',
  textAlign: 'center' as const,
};

const divider = {
  borderColor: '#E5E7EB',
  margin: '25px 0',
};

const footerText = {
  color: '#4B5563',
  fontSize: '11px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  margin: '0 0 5px',
  fontWeight: 'bold',
};

const footerSubtext = {
  color: '#9CA3AF',
  fontSize: '9px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  lineHeight: '14px',
  margin: '0',
};

export default EmailFooter;
