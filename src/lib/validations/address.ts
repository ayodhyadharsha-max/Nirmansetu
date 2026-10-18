import { z } from 'zod';

export const AddressSchema = z.object({
  addressType: z.enum(['site', 'residential', 'commercial'], {
    required_error: 'Please select an address type (Site, Residential, or Commercial)',
  }),
  siteOrPersonName: z.string().trim().min(2, 'Name or site title must be at least 2 characters').max(150),
  contactPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
  alternatePhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
  streetAddress: z.string().trim().min(5, 'Street address or landmark description is too short').max(500),
  landmark: z.string().trim().max(200).optional().or(z.literal('')),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit PIN code'),
  city: z.string().trim().default('Ayodhya'),
  state: z.string().trim().default('Uttar Pradesh'),
  unloadingInstructions: z.string().trim().max(500).optional().or(z.literal('')),
  hasTruckAccess: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof AddressSchema>;
