import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/roles';
import { reassignAlternativeSupplier } from '@/lib/fulfillment/service';

const ReassignSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  newSupplierId: z.string().min(1, 'New Supplier ID is required'),
  reason: z.string().trim().min(3, 'Reassignment reason required'),
});

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = ReassignSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await reassignAlternativeSupplier(
      parsed.data.orderId,
      parsed.data.newSupplierId,
      adminSession,
      parsed.data.reason
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order successfully reassigned to alternative supplier.',
      order: result.order,
      po: result.po,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
