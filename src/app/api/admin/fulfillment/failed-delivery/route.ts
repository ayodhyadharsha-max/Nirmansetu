import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/roles';
import { recordDeliveryFailure } from '@/lib/fulfillment/service';

const FailedDeliverySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  failureReason: z.string().trim().min(3, 'Failure reason required'),
  retryScheduledAt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['admin', 'supplier'], request);
    const json = await request.json();
    const parsed = FailedDeliverySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await recordDeliveryFailure(
      parsed.data.orderId,
      parsed.data.failureReason,
      parsed.data.retryScheduledAt,
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery failure recorded and retry window scheduled.',
      delivery: result.delivery,
      order: result.order,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
