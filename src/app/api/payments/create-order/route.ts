import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const CreatePaymentOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = CreatePaymentOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let userId = parsed.data.userId;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    const res = await createRazorpayOrder({
      orderId: parsed.data.orderId,
      userId,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to initiate payment gateway order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      gatewayOrderId: res.gatewayOrderId,
      amountPaise: res.amountPaise,
      currency: res.currency,
      keyId: res.keyId,
      isTestMode: res.isTestMode,
      paymentId: res.paymentId,
      message: res.isTestMode
        ? 'Payment initiated in authenticated test mode. Simulated Razorpay credentials active.'
        : 'Payment order created on Razorpay gateway.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment order creation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
