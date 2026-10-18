import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/roles';
import { recordDeliveryCompletion } from '@/lib/fulfillment/service';

const VerifyDeliverySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  deliveryOtp: z.string().trim().regex(/^\d{4}$/, 'Must be a 4-digit numeric Drop-off OTP'),
  completionNotes: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['admin', 'supplier'], request);
    const json = await request.json();
    const parsed = VerifyDeliverySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await recordDeliveryCompletion(
      parsed.data.orderId,
      parsed.data.deliveryOtp,
      parsed.data.completionNotes,
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Site delivery physically verified and marked completed.',
      delivery: result.delivery,
      order: result.order,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
