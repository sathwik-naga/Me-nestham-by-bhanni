import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface DeliveredEmailProps {
  orderId: string;
  customerName: string;
}

export const DeliveredEmail: React.FC<DeliveredEmailProps> = ({
  orderId,
  customerName,
}) => {
  return (
    <EmailLayout previewText={`Delivered - Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Delivered Successfully!</Heading>
      <Text style={textStyle}>
        Dear {customerName}, our courier partner reports that your package for Order #{orderId.substring(0, 8)} has been delivered.
      </Text>

      <Section style={deliveredDetailsSection}>
        <Text style={detailsHeader}>Delivery Details</Text>
        <Text style={detailsText}>
          If you did not receive this package, please contact our support team immediately by responding to this email or checking with your neighbors/front desk.
        </Text>
      </Section>

      <EmailButton href={`http://localhost:5173/profile?tab=orders`}>
        View Order History
      </EmailButton>

      <Text style={textStyle}>
        Thank you for choosing Me Nestham. We look forward to serving you again soon!
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#059669', // Emerald success color
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

const deliveredDetailsSection = {
  backgroundColor: '#ECFDF5',
  border: '1px solid #A7F3D0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const detailsHeader = {
  color: '#047857',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 10px',
};

const detailsText = {
  color: '#065F46',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
};

export default DeliveredEmail;
