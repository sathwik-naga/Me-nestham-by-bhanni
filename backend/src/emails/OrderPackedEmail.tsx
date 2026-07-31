import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface OrderPackedEmailProps {
  orderId: string;
  customerName: string;
}

export const OrderPackedEmail: React.FC<OrderPackedEmailProps> = ({
  orderId,
  customerName,
}) => {
  const trackingUrl = `${process.env.ORDER_TRACKING_BASE_URL || 'https://www.menesthambybhanni.com/orders'}/${orderId}/track`;

  return (
    <EmailLayout previewText={`Order #${orderId.substring(0, 8)} is Packed & Ready!`}>
      <Heading style={headingStyle}>Your Order is Packed!</Heading>
      <Text style={textStyle}>
        Hi {customerName}, great news! Your items for Order #{orderId.substring(0, 8)} have been carefully packed with protective cushioning and are waiting for courier pickup.
      </Text>

      <EmailButton href={trackingUrl}>
        Track Shipment Progress
      </EmailButton>

      <Text style={textStyle}>
        You will receive tracking link details as soon as our courier partner scans your package at dispatch.
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
