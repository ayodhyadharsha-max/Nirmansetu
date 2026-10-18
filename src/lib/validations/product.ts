import { z } from 'zod';

export const BaseProductSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(255),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with dashes'),
  categoryId: z.string().uuid({ message: 'Valid category UUID is required' }),
  brandId: z.string().uuid().optional().or(z.literal('')),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
  hsnCode: z.string().trim().max(10).optional(),
  unitOfMeasure: z.enum(['bags', 'pieces', 'boxes', 'metres', 'litres', 'kilograms'], {
    required_error: 'Unit of measure must be one of: bags, pieces, boxes, metres, litres, kilograms',
  }),
  packSize: z.string().trim().max(100).optional(),
  mrpPaise: z.number().int().min(0, 'MRP must be non-negative'),
  sellingPricePaise: z.number().int().min(0, 'Selling price must be non-negative'),
  minOrderQty: z.number().int().positive('Minimum order quantity must be at least 1'),
  specifications: z.record(z.unknown()).optional().default({}),
  images: z.array(z.string().url()).optional().default([]),
  publicationStatus: z.enum(['draft', 'published', 'archived']).default('published'),
  taxRatePct: z.number().min(0).max(50).default(18.0),
});

export const ProductCreateSchema = BaseProductSchema.refine(
  (data) => data.sellingPricePaise <= data.mrpPaise || data.mrpPaise === 0,
  {
    message: 'Selling price cannot exceed the Maximum Retail Price (MRP)',
    path: ['sellingPricePaise'],
  }
);

export const ProductUpdateSchema = BaseProductSchema.partial().refine(
  (data) => {
    if (data.sellingPricePaise !== undefined && data.mrpPaise !== undefined) {
      return data.sellingPricePaise <= data.mrpPaise || data.mrpPaise === 0;
    }
    return true;
  },
  {
    message: 'Selling price cannot exceed the Maximum Retail Price (MRP)',
    path: ['sellingPricePaise'],
  }
);

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
