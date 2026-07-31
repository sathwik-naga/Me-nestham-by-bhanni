import React from 'react';
import { Section, Text, Heading } from '@react-email/components';

export const EmailHeader: React.FC = () => {
  return (
    <Section style={headerSection}>
      <Heading style={logoText}>Me Nestham</Heading>
      <Text style={taglineText}>Pure & Premium Direct-to-Consumer Goods</Text>
    </Section>
  );
};

const headerSection = {
  padding: '30px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#1E1B4B',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
};

const logoText = {
  color: '#FBBF24',
  fontSize: '28px',
  fontFamily: 'Georgia, serif',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '1px',
};

const taglineText = {
  color: '#E0E7FF',
  fontSize: '11px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  margin: '5px 0 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
};
export default EmailHeader;
