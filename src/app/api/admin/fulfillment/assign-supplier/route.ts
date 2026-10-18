import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/roles';
import { assignSupplierToOrder } from '@/lib/fulfillment/service';

const AssignSupplierSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
});

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = AssignSupplierSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await assignSupplierToOrder(parsed.data.orderId, parsed.data.supplierId, adminSession);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Purchase Order ${result.po?.po_number} issued and supplier assigned.`,
      order: result.order,
      po: result.po,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
