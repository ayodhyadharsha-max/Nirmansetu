import { z } from 'zod';

export const BulkEnquirySchema = z.object({
  contactName: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  companyOrFirmName: z.string().trim().max(200).optional().or(z.literal('')),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid 15-character GSTIN format')
    .optional()
    .or(z.literal('')),
  projectType: z.enum([
    'residential_house',
    'commercial_complex',
    'hotel_ashram',
    'temple_infrastructure',
    'government_contract',
    'renovation',
  ], {
    required_error: 'Select a project type',
  }),
  projectTitle: z.string().trim().min(3, 'Project title is required').max(200),
  projectAddress: z.string().trim().min(5, 'Site address is required').max(500),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit PIN code'),
  estimatedBudgetPaise: z.number().int().min(0).optional(),
  targetDeliveryDate: z.string().optional(),
  materialRequirements: z
    .string()
    .trim()
    .min(10, 'Please describe required materials in at least 10 characters (e.g. 500 bags PPC Cement, 5 tons 12mm TMT, 20,000 bricks)'),
  structuredItems: z
    .array(
      z.object({
        category: z.string().optional(),
        title: z.string().min(1, 'Item title is required'),
        approxQty: z.number().positive('Quantity must be greater than 0'),
        unit: z.string().min(1, 'Unit is required'),
      })
    )
    .optional()
    .default([]),
});

export type BulkEnquiryInput = z.infer<typeof BulkEnquirySchema>;
