import { z } from 'zod';

export const createOrderValidator = z.object({
  body: z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    currency: z.string().min(1, 'Currency is required'),
    receipt: z.string().min(1, 'Receipt is required'),
  }),
});

export const verifyPaymentValidator = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1, 'Razorpay order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Razorpay payment ID is required'),
    razorpay_signature: z.string().min(1, 'Razorpay signature is required'),
  }),
});
