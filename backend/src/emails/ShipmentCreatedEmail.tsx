import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface ShipmentCreatedEmailProps {
  orderId: string;
  customerName: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
}

export const ShipmentCreatedEmail: React.FC<ShipmentCreatedEmailProps> = ({
  orderId,
  customerName,
  courierName,
  trackingNumber,
  trackingUrl,
}) => {
  return (
    <EmailLayout previewText={`Shipment Packaged - Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Your shipment has been created!</Heading>
      <Text style={textStyle}>
        Hello {customerName}, we have packaged your items and generated a shipping label. A courier partner has been assigned to pick up your package.
      </Text>

      <Section style={shipmentDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Courier Carrier:</span>
          <span style={detailVal}>{courierName}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>AWB/Tracking Code:</span>
          <span style={detailVal}>{trackingNumber}</span>
        </div>
      </Section>

      <EmailButton href={trackingUrl || `http://localhost:5173/orders/${orderId}/track`}>
        Track Package Delivery
      </EmailButton>

      <Text style={textStyle}>
        Please note that tracking activities may take up to 24 hours to populate on the courier partner's portal after pickup.
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

const shipmentDetailsSection = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
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
  color: '#4B5563',
  fontWeight: 'bold',
};

const detailVal = {
  color: '#111827',
  fontWeight: '500',
};

export default ShipmentCreatedEmail;
