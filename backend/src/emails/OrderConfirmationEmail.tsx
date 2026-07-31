import React from 'react';
import { Text, Heading, Section, Hr } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  orderId,
  customerName,
  items,
  totalAmount,
}) => {
  return (
    <EmailLayout previewText={`Order Confirmation - #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>Thank you for your order, {customerName}!</Heading>
      <Text style={textStyle}>
        We have received your order and are currently preparing it for processing. Here is a summary of your purchased items:
      </Text>

      <Section style={itemsSection}>
        {items.map((item, idx) => (
          <div key={idx} style={itemRow}>
            <span style={itemName}>
              {item.name} <span style={itemQty}>x{item.quantity}</span>
            </span>
            <span style={itemPrice}>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <Hr style={divider} />
        <div style={totalRow}>
          <span style={totalLabel}>Total Amount:</span>
          <span style={totalValue}>₹{totalAmount}</span>
        </div>
      </Section>

      <EmailButton href={`http://localhost:5173/profile?tab=orders`}>
        Track Your Order
      </EmailButton>

      <Text style={textStyle}>
        Once your order has been packed and scheduled for dispatch, we will notify you with the shipping details.
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

const itemsSection = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #F3F4F6',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const itemRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '13px',
  marginBottom: '10px',
};

const itemName = {
  color: '#374151',
  fontWeight: '500',
};

const itemQty = {
  color: '#9CA3AF',
  marginLeft: '5px',
};

const itemPrice = {
  color: '#111827',
  fontWeight: 'bold',
  fontFamily: 'monospace',
};

const divider = {
  borderColor: '#E5E7EB',
  margin: '15px 0',
};

const totalRow = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  fontSize: '14px',
  fontWeight: 'bold',
};

const totalLabel = {
  color: '#1F2937',
};

const totalValue = {
  color: '#1E1B4B',
  fontFamily: 'monospace',
};

export default OrderConfirmationEmail;
