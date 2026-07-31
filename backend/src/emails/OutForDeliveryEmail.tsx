import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface OutForDeliveryEmailProps {
  orderId: string;
  customerName: string;
  courierName: string;
  trackingNumber: string;
}

export const OutForDeliveryEmail: React.FC<OutForDeliveryEmailProps> = ({
  orderId,
  customerName,
  courierName,
  trackingNumber,
}) => {
  return (
    <EmailLayout previewText={`Out For Delivery - Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Your package is out for delivery today!</Heading>
      <Text style={textStyle}>
        Hello {customerName}, the courier delivery agent is carrying your package and expects to deliver it to your address today.
      </Text>

      <Section style={deliveryDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Courier Partner:</span>
          <span style={detailVal}>{courierName}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Tracking code (AWB):</span>
          <span style={detailVal}>{trackingNumber}</span>
        </div>
      </Section>

      <EmailButton href={`http://localhost:5173/orders/${orderId}/track`}>
        Track Delivery Agent
      </EmailButton>

      <Text style={textStyle}>
        Please make sure someone is available at your shipping destination address to receive the package.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#D97706', // Amber color for delivery today
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

const deliveryDetailsSection = {
  backgroundColor: '#FEF3C7', // Light amber background
  border: '1px solid #FDE68A',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '12px',
  marginBottom: '8px',
};

const detailLabel = {
  color: '#B45309',
  fontWeight: 'bold',
};

const detailVal = {
  color: '#111827',
  fontFamily: 'monospace',
};

export default OutForDeliveryEmail;
