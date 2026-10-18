import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder } from '@/lib/orders/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const OrderSubmissionSchema = z.object({
  idempotencyKey: z.string().trim().max(100).optional(),
  cartId: z.string().min(1, 'Cart ID is required'),
  customerDetails: z.object({
    name: z.string().trim().min(2, 'Customer name is required'),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: z.string().email().optional().or(z.literal('')),
    companyName: z.string().trim().max(200).optional().or(z.literal('')),
    gstin: z.string().trim().max(15).optional().or(z.literal('')),
  }),
  deliveryAddress: z.object({
    addressType: z.enum(['site', 'residential', 'commercial']).default('site'),
    siteOrPersonName: z.string().trim().min(2, 'Site or receiver name is required'),
    contactPhone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number'),
    alternatePhone: z.string().trim().optional().or(z.literal('')),
    streetAddress: z.string().trim().min(5, 'Street address is too short'),
    landmark: z.string().trim().optional().or(z.literal('')),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
    city: z.string().trim().default('Ayodhya'),
    state: z.string().trim().default('Uttar Pradesh'),
    unloadingInstructions: z.string().trim().max(500).optional().or(z.literal('')),
    hasTruckAccess: z.boolean().default(true),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'neft_rtgs', 'credit_line'], {
    required_error: 'Select a valid payment method',
  }),
  isExpressDelivery: z.boolean().default(false),
  customerNotes: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = OrderSubmissionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = result.data;

    // Check optional authenticated user
    let userId: string | undefined;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Optional
    }

    const orderRes = await createOrder({
      idempotencyKey: input.idempotencyKey,
      cartId: input.cartId,
      userId,
      customerDetails: {
        name: input.customerDetails.name,
        phone: input.customerDetails.phone,
        email: input.customerDetails.email || undefined,
        companyName: input.customerDetails.companyName || undefined,
        gstin: input.customerDetails.gstin || undefined,
      },
      deliveryAddress: input.deliveryAddress,
      paymentMethod: input.paymentMethod,
      isExpressDelivery: input.isExpressDelivery,
      customerNotes: input.customerNotes || undefined,
    });

    if (!orderRes.success || !orderRes.order) {
      return NextResponse.json(
        { success: false, error: orderRes.error || 'Failed to place order' },
        { status: 400 }
      );
    }

    const order = orderRes.order;

    return NextResponse.json({
      success: true,
      isDuplicate: orderRes.isDuplicate || false,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      totalPaise: order.total_paise,
      subtotalPaise: order.subtotal_paise,
      taxPaise: order.tax_paise,
      deliveryFeePaise: order.delivery_fee_paise,
      discountPaise: order.discount_paise,
      deliveryOtp: order.delivery_otp_plain,
      message: orderRes.isDuplicate
        ? 'Duplicate order prevented. Existing order returned.'
        : 'Order successfully created and queued for approved Ayodhya supplier fulfillment.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order submission failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
