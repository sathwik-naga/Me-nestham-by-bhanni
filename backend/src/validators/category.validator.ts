import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Category name is required').max(100, 'Category name is too long'),
    description: z.string().trim().max(500, 'Description is too long').optional().nullable(),
    image_url: z.string().url('Please provide a valid URL for category image').optional().nullable().or(z.literal('')),
  }),
});

export const updateCategorySchema = z.object({
  body: createCategorySchema.shape.body.partial(),
});
