import { z } from 'zod';

const addressSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address format'),
  address_line1: z.string().min(1, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const checkoutSchema = z.object({
  body: z.object({
    billing_address: addressSchema,
    shipping_address: addressSchema,
    shipping_fee: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    payment_status: z.enum(['pending', 'paid', 'failed', 'cancelled', 'refunded']).optional(),
  }).refine((data) => data.status !== undefined || data.payment_status !== undefined, {
    message: 'Either status or payment_status must be provided for update',
  }),
});
