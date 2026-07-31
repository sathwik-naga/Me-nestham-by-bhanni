import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface OrderShippedEmailProps {
  orderId: string;
  customerName: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
}

export const OrderShippedEmail: React.FC<OrderShippedEmailProps> = ({
  orderId,
  customerName,
  courierName,
  trackingNumber,
  trackingUrl,
}) => {
  return (
    <EmailLayout previewText={`Order Shipped - #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Your order is on its way!</Heading>
      <Text style={textStyle}>
        Great news, {customerName}! Your package has been picked up by our logistics partner and is now in transit.
      </Text>

      <Section style={shipmentDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Courier Carrier:</span>
          <span style={detailVal}>{courierName}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Tracking Number (AWB):</span>
          <span style={detailVal}>{trackingNumber}</span>
        </div>
      </Section>

      <EmailButton href={trackingUrl || `http://localhost:5173/orders/${orderId}/track`}>
        Track Shipment Progress
      </EmailButton>

      <Text style={textStyle}>
        You can check the live tracking timeline on our website or on the courier carrier's portal using the tracking button above.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#3B82F6', // Blue color for shipping/in-transit
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

const shipmentDetailsSection = {
  backgroundColor: '#EFF6FF', // Light blue background
  border: '1px solid #DBEAFE',
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
  color: '#1D4ED8',
  fontWeight: 'bold',
};

const detailVal = {
  color: '#111827',
  fontFamily: 'monospace',
};

export default OrderShippedEmail;
