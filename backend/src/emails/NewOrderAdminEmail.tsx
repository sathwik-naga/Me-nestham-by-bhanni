import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface NewOrderAdminEmailProps {
  orderId: string;
  customerName: string;
  totalItems: number;
  grandTotal: number;
}

export const NewOrderAdminEmail: React.FC<NewOrderAdminEmailProps> = ({
  orderId,
  customerName,
  totalItems,
  grandTotal,
}) => {
  return (
    <EmailLayout previewText={`New Order Placed - #${orderId.substring(0, 8)}`}>
      <Heading style={headingStyle}>New Customer Order Received</Heading>
      <Text style={textStyle}>
        An order has been successfully placed by a customer on the Me Nestham platform. Please review the details below:
      </Text>

      <Section style={orderDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Order ID:</span>
          <span style={detailVal}>{orderId}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Customer:</span>
          <span style={detailVal}>{customerName}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Total Items:</span>
          <span style={detailVal}>{totalItems}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Grand Total:</span>
          <span style={totalVal}>₹{grandTotal}</span>
        </div>
      </Section>

      <EmailButton href={`http://localhost:5173/admin/orders`}>
        View Orders Dashboard
      </EmailButton>

      <Text style={textStyle}>
        Verify payment status in the dashboard and fulfill shipment logistics via Shiprocket once cleared.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#1E1B4B',
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

const orderDetailsSection = {
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
};

const totalVal = {
  color: '#1E1B4B',
  fontWeight: 'bold',
  fontFamily: 'monospace',
};

export default NewOrderAdminEmail;
