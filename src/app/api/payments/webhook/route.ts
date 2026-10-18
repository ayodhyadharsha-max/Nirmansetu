import { NextResponse } from 'next/server';
import { handleRazorpayWebhook } from '@/lib/payments/razorpay';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const rawBody = await request.text();
    const result = await handleRazorpayWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Webhook verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      duplicate: result.isDuplicate || false,
      eventType: result.eventType,
      message: result.isDuplicate ? 'Duplicate webhook acknowledged without reprocessing' : 'Webhook event processed successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook handling error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
