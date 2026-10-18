import { NextResponse } from 'next/server';
import { reconcilePaymentStatus } from '@/lib/payments/razorpay';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId parameter is required' }, { status: 400 });
    }

    const reconciliation = await reconcilePaymentStatus(orderId);

    return NextResponse.json({
      success: true,
      reconciliation,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reconciliation check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
