import { NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmVerifiedPayment, recordPaymentFailure } from '@/lib/payments/razorpay';

const VerifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  gatewayOrderId: z.string().min(1, 'Gateway Order ID is required'),
  gatewayPaymentId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  isFailure: z.boolean().default(false),
  errorCode: z.string().optional(),
  errorDescription: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = VerifyPaymentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      orderId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      isFailure,
      errorCode,
      errorDescription,
    } = parsed.data;

    // Handle failure case
    if (isFailure || !gatewayPaymentId || !gatewaySignature) {
      await recordPaymentFailure({
        orderId,
        gatewayOrderId,
        errorCode: errorCode || 'USER_CANCELLED_OR_FAILED',
        errorDescription: errorDescription || 'Payment transaction failed or was cancelled by user',
      });

      return NextResponse.json(
        {
          success: false,
          error: errorDescription || 'Payment attempt failed. You may retry payment without re-creating your order.',
          canRetry: true,
        },
        { status: 400 }
      );
    }

    // Cryptographic server-side verification
    const verification = await confirmVerifiedPayment({
      orderId,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
    });

    if (!verification.success || !verification.order) {
      return NextResponse.json(
        {
          success: false,
          error: verification.error || 'Payment signature verification failed. Order not confirmed.',
        },
        { status: 400 }
      );
    }

    const order = verification.order;

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
      totalPaise: order.total_paise,
      deliveryOtp: order.delivery_otp_plain,
      message: 'Payment verified successfully! Your order has been confirmed and routed to local Ayodhya suppliers.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
