import React from 'react';
import { Text, Heading, Section, Hr } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface PaymentConfirmationEmailProps {
  orderId: string;
  customerName: string;
  transactionId: string;
  amountPaid: number;
  paymentMethod: string;
}

export const PaymentConfirmationEmail: React.FC<PaymentConfirmationEmailProps> = ({
  orderId,
  customerName,
  transactionId,
  amountPaid,
  paymentMethod,
}) => {
  const trackingUrl = `${process.env.ORDER_TRACKING_BASE_URL || 'https://www.menesthambybhanni.com/orders'}/${orderId}/track`;

  return (
    <EmailLayout previewText={`Payment Receipt for Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Payment Confirmed!</Heading>
      <Text style={textStyle}>
        Hi {customerName}, we have successfully received your payment of <strong>₹{amountPaid}</strong> for Order #{orderId.substring(0, 8)}.
      </Text>

      <Section style={detailsBox}>
        <div style={detailRow}>
          <span style={labelStyle}>Order ID:</span>
          <span style={valStyle}>#{orderId}</span>
        </div>
        <div style={detailRow}>
          <span style={labelStyle}>Transaction Ref:</span>
          <span style={valStyle}>{transactionId}</span>
        </div>
        <div style={detailRow}>
          <span style={labelStyle}>Payment Method:</span>
          <span style={valStyle}>{paymentMethod}</span>
        </div>
        <div style={detailRow}>
          <span style={labelStyle}>Amount Paid:</span>
          <span style={valStyle}>₹{amountPaid}</span>
        </div>
      </Section>

      <EmailButton href={trackingUrl}>
        View Order Status
      </EmailButton>

      <Text style={textStyle}>
        Your items are being hand-crafted and prepared for packing. We will send you another update once your package is dispatched.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#E8873A',
  fontSize: '20px',
  fontFamily: 'Georgia, serif',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const textStyle = {
  color: '#4B5563',
  fontSize: '14px',
  lineHeight: '22px',
  marginBottom: '16px',
};

const detailsBox = {
  backgroundColor: '#FFF7FA',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid #FBCFE8',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
  fontSize: '13px',
};

const labelStyle = {
  color: '#6B7280',
  fontWeight: '600',
};

const valStyle = {
  color: '#111827',
  fontWeight: 'bold',
};
