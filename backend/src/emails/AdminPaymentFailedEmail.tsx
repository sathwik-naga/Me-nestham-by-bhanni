import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';

interface AdminPaymentFailedEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  errorMessage?: string;
}

export const AdminPaymentFailedEmail: React.FC<AdminPaymentFailedEmailProps> = ({
  orderId,
  customerName,
  customerEmail,
  amount,
  errorMessage = 'Razorpay verification signature mismatch or gateway timeout',
}) => {
  return (
    <EmailLayout previewText={`ALERT: Payment Failed for Order #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Payment Verification Failed</Heading>
      <Text style={textStyle}>
        A payment verification attempt failed for Order #{orderId.substring(0, 8)}. Details below:
      </Text>

      <Section style={boxStyle}>
        <Text style={itemText}><strong>Customer:</strong> {customerName} ({customerEmail})</Text>
        <Text style={itemText}><strong>Order ID:</strong> #{orderId}</Text>
        <Text style={itemText}><strong>Amount:</strong> ₹{amount}</Text>
        <Text style={itemText}><strong>Error Reason:</strong> {errorMessage}</Text>
      </Section>

      <Text style={textStyle}>
        Please inspect the transaction in your Razorpay dashboard and follow up with the customer if necessary.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#DC2626',
  fontSize: '18px',
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

const boxStyle = {
  backgroundColor: '#FEF2F2',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '20px',
  border: '1px solid #FCA5A5',
};

const itemText = {
  color: '#991B1B',
  fontSize: '13px',
  margin: '4px 0',
};
