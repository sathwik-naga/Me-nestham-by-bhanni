import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    product_id: z.string().uuid('Invalid product ID format'),
    quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
  }),
});
