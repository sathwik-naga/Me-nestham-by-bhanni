import { z } from 'zod';

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    categoryId: z.string().uuid('Invalid category ID format').optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['created_at', 'price', 'name']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

const imageSchema = z.object({
  image_url: z.string().url('Please provide a valid image URL'),
  is_featured: z.boolean().default(false),
  position: z.number().int().default(0),
});

const variantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required'),
  name: z.string().trim().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Variant price must be non-negative'),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
});

export const createProductSchema = z.object({
  body: z.object({
    category_id: z.string().uuid('Invalid category ID'),
    name: z.string().trim().min(1, 'Product name is required').max(150, 'Product name is too long'),
    description: z.string().trim().min(1, 'Product description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    compare_price: z.number().min(0).optional().nullable(), // DB column compare_price
    stock: z.number().int().min(0, 'Stock must be non-negative').default(0),
    is_active: z.boolean().default(true),
    featured: z.boolean().default(false), // DB column featured
    bestseller: z.boolean().default(false), // DB column bestseller
    image_url: z.string().url('Invalid image URL').optional().nullable(), // DB column image_url
    images: z.array(imageSchema).optional(),
    variants: z.array(variantSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});
