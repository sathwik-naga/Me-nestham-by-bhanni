import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface PaymentSuccessEmailProps {
  orderId: string;
  customerName: string;
  paymentId: string;
  amount: number;
}

export const PaymentSuccessEmail: React.FC<PaymentSuccessEmailProps> = ({
  orderId,
  customerName,
  paymentId,
  amount,
}) => {
  return (
    <EmailLayout previewText={`Payment Received - Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Payment Confirmed!</Heading>
      <Text style={textStyle}>
        Dear {customerName}, we have successfully verified and captured your payment for Order #{orderId.substring(0, 8)}.
      </Text>

      <Section style={paymentDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Razorpay Payment ID:</span>
          <span style={detailVal}>{paymentId}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Captured Amount:</span>
          <span style={detailVal}>₹{amount}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Order ID Reference:</span>
          <span style={detailVal}>{orderId}</span>
        </div>
      </Section>

      <EmailButton href={`http://localhost:5173/profile?tab=orders`}>
        View Order Status
      </EmailButton>

      <Text style={textStyle}>
        Our warehouse team is preparing to pack and dispatch your order. You will receive another update with shipment tracking once the package leaves our warehouse.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#059669', // Emerald color for success
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

const paymentDetailsSection = {
  backgroundColor: '#F0FDF4', // Light green background
  border: '1px solid #DCFCE7',
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
  color: '#15803D',
  fontWeight: 'bold',
};

const detailVal = {
  color: '#111827',
  fontFamily: 'monospace',
};

export default PaymentSuccessEmail;
