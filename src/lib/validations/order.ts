import { z } from 'zod';
import { AddressSchema } from './address';

export const CheckoutOrderSchema = z.object({
  cartId: z.string().uuid({ message: 'Valid cart ID is required' }),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, { message: 'Valid 6-digit delivery PIN code required' }),
  deliveryAddressId: z.string().uuid().optional(),
  inlineAddress: AddressSchema.optional(),
  paymentMethod: z.enum(['razorpay', 'cod', 'neft_rtgs', 'credit_line'], {
    required_error: 'Select a payment method',
  }),
  couponCode: z.string().trim().max(50).optional().or(z.literal('')),
  customerNotes: z.string().trim().max(500).optional().or(z.literal('')),
  isExpressDelivery: z.boolean().default(false),
}).refine(
  (data) => data.deliveryAddressId || data.inlineAddress,
  {
    message: 'Either an existing delivery address ID or inline address details must be provided',
    path: ['deliveryAddressId'],
  }
);

export type CheckoutOrderInput = z.infer<typeof CheckoutOrderSchema>;
