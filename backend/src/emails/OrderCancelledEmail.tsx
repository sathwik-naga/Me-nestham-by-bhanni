import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface OrderCancelledEmailProps {
  orderId: string;
  customerName: string;
  reason?: string;
  refundTimeline?: string;
}

export const OrderCancelledEmail: React.FC<OrderCancelledEmailProps> = ({
  orderId,
  customerName,
  reason = 'Customer requested cancellation',
  refundTimeline = '3 to 5 business days to your original payment method',
}) => {
  return (
    <EmailLayout previewText={`Order #${orderId.substring(0, 8)} Cancellation Notice`}>
      <Heading style={headingStyle}>Order Cancelled</Heading>
      <Text style={textStyle}>
        Hi {customerName}, your Order #{orderId.substring(0, 8)} has been cancelled.
      </Text>

      <Section style={detailsBox}>
        <Text style={detailText}>
          <strong>Reason:</strong> {reason}
        </Text>
        <Text style={detailText}>
          <strong>Refund Status:</strong> Initiated ({refundTimeline})
        </Text>
      </Section>

      <Text style={textStyle}>
        If you have any questions or need further assistance, please reach out to our support team at funnycolours123@gmail.com or via WhatsApp at +91 99493 45197.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#DC2626',
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
  backgroundColor: '#FEF2F2',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid #FCA5A5',
};

const detailText = {
  color: '#991B1B',
  fontSize: '13px',
  margin: '4px 0',
};
