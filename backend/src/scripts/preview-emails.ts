import { render } from '@react-email/render';
import fs from 'fs';
import path from 'path';
import React from 'react';

import { WelcomeEmail } from '../emails/WelcomeEmail';
import { OrderConfirmationEmail } from '../emails/OrderConfirmationEmail';
import { PaymentSuccessEmail } from '../emails/PaymentSuccessEmail';
import { ShipmentCreatedEmail } from '../emails/ShipmentCreatedEmail';
import { OrderShippedEmail } from '../emails/OrderShippedEmail';
import { OutForDeliveryEmail } from '../emails/OutForDeliveryEmail';
import { DeliveredEmail } from '../emails/DeliveredEmail';
import { PasswordResetEmail } from '../emails/PasswordResetEmail';
import { LowStockAlertEmail } from '../emails/LowStockAlertEmail';
import { NewOrderAdminEmail } from '../emails/NewOrderAdminEmail';

const outputDir = path.join(__dirname, '../../dist/preview-emails');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const mockOrder = {
  id: 'order-12345678',
  customerName: 'Anil Kumar',
  items: [
    { name: 'Organic Honey', quantity: 2, price: 250 },
    { name: 'Cold Pressed Peanut Oil', quantity: 1, price: 450 }
  ],
  totalAmount: 950
};

const previews = [
  {
    name: 'WelcomeEmail.html',
    element: React.createElement(WelcomeEmail, { fullName: 'Sathwik Naga' })
  },
  {
    name: 'OrderConfirmationEmail.html',
    element: React.createElement(OrderConfirmationEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      items: mockOrder.items,
      totalAmount: mockOrder.totalAmount
    })
  },
  {
    name: 'PaymentSuccessEmail.html',
    element: React.createElement(PaymentSuccessEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      paymentId: 'pay_verify1234',
      amount: mockOrder.totalAmount
    })
  },
  {
    name: 'ShipmentCreatedEmail.html',
    element: React.createElement(ShipmentCreatedEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      courierName: 'Delhivery Express',
      trackingNumber: 'DEL123456789',
      trackingUrl: 'https://shiprocket.co/tracking/DEL123456789'
    })
  },
  {
    name: 'OrderShippedEmail.html',
    element: React.createElement(OrderShippedEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      courierName: 'Delhivery Express',
      trackingNumber: 'DEL123456789',
      trackingUrl: 'https://shiprocket.co/tracking/DEL123456789'
    })
  },
  {
    name: 'OutForDeliveryEmail.html',
    element: React.createElement(OutForDeliveryEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      courierName: 'Delhivery Express',
      trackingNumber: 'DEL123456789'
    })
  },
  {
    name: 'DeliveredEmail.html',
    element: React.createElement(DeliveredEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName
    })
  },
  {
    name: 'PasswordResetEmail.html',
    element: React.createElement(PasswordResetEmail, {
      resetLink: 'http://localhost:5173/reset-password?token=mock_recovery_token'
    })
  },
  {
    name: 'LowStockAlertEmail.html',
    element: React.createElement(LowStockAlertEmail, {
      productName: 'Organic Ghee',
      productSlug: 'organic-ghee-500ml',
      currentStock: 3
    })
  },
  {
    name: 'NewOrderAdminEmail.html',
    element: React.createElement(NewOrderAdminEmail, {
      orderId: mockOrder.id,
      customerName: mockOrder.customerName,
      totalItems: 3,
      grandTotal: mockOrder.totalAmount
    })
  }
];

console.log('Rendering email templates to static HTML...');

async function run() {
  for (const preview of previews) {
    try {
      const html = await render(preview.element);
      fs.writeFileSync(path.join(outputDir, preview.name), html);
      console.log(`✓ Rendered preview to: dist/preview-emails/${preview.name}`);
    } catch (err) {
      console.error(`✗ Failed rendering ${preview.name}:`, err);
    }
  }
  console.log('Rendering complete. You can open any of the HTML files to preview.');
}

run();
