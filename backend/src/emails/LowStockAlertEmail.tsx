import React from 'react';
import { Text, Heading, Section } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';

interface LowStockAlertEmailProps {
  productName: string;
  productSlug: string;
  currentStock: number;
}

export const LowStockAlertEmail: React.FC<LowStockAlertEmailProps> = ({
  productName,
  productSlug,
  currentStock,
}) => {
  return (
    <EmailLayout previewText={`Low Stock Alert: ${productName}`}>
      <Heading style={headingStyle}>Inventory Alert: Low Stock Detected</Heading>
      <Text style={textStyle}>
        The system has detected that the inventory level for the following product has fallen below the configured warning threshold.
      </Text>

      <Section style={alertDetailsSection}>
        <div style={detailRow}>
          <span style={detailLabel}>Product:</span>
          <span style={detailVal}>{productName}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Slug Identifier:</span>
          <span style={detailVal}>{productSlug}</span>
        </div>
        <div style={detailRow}>
          <span style={detailLabel}>Current Stock:</span>
          <span style={stockVal}>{currentStock} units left</span>
        </div>
      </Section>

      <EmailButton href={`http://localhost:5173/admin/inventory`}>
        Restock Inventory
      </EmailButton>

      <Text style={textStyle}>
        Please restock this item soon to prevent order interruptions and stock-outs for clients.
      </Text>
    </EmailLayout>
  );
};

const headingStyle = {
  color: '#DC2626', // Red color for alerts
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

const alertDetailsSection = {
  backgroundColor: '#FEF2F2', // Light red background
  border: '1px solid #FEE2E2',
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
  color: '#991B1B',
  fontWeight: 'bold',
};

const detailVal = {
  color: '#111827',
};

const stockVal = {
  color: '#DC2626',
  fontWeight: 'bold',
};

export default LowStockAlertEmail;
