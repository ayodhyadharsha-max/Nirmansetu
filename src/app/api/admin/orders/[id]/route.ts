import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateOrderStatusAdmin } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

interface Params {
  params: { id: string };
}

const UpdateStatusSchema = z.object({
  status: z.enum([
    'draft',
    'submitted',
    'confirmed',
    'po_issued',
    'materials_packed',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  notes: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const adminSession = await requireAdmin(request);
    const orderId = params.id;
    const json = await request.json();
    const parsed = UpdateStatusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await updateOrderStatusAdmin(
      orderId,
      parsed.data.status,
      adminSession,
      parsed.data.notes
    );

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${parsed.data.status}`,
      order: res.order,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
