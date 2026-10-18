import { z } from 'zod';

export const AddToCartSchema = z.object({
  variantId: z.string().uuid({ message: 'Invalid product variant ID' }),
  quantity: z.number().int().positive({ message: 'Quantity must be at least 1' }).max(5000, { message: 'Maximum 5,000 units per line item' }),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, { message: 'Must be a valid 6-digit Indian PIN code' }).optional(),
});

export const UpdateCartItemSchema = z.object({
  cartItemId: z.string().uuid({ message: 'Invalid cart item ID' }),
  quantity: z.number().int().min(0, { message: 'Quantity cannot be negative' }).max(5000),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
