import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSupplier } from '@/lib/auth/roles';
import { supplierRespondToAssignment } from '@/lib/fulfillment/service';

const SupplierResponseSchema = z.object({
  poId: z.string().min(1, 'PO ID is required'),
  supplierId: z.string().optional(),
  action: z.enum(['confirm', 'reject']),
  notes: z.string().trim().max(500).optional().default(''),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSupplier(request);
    const json = await request.json();
    const parsed = SupplierResponseSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const orderId = params.id;
    const supplierId = parsed.data.supplierId || session.supplierId;
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const result = await supplierRespondToAssignment(
      orderId,
      parsed.data.poId,
      supplierId,
      parsed.data.action,
      parsed.data.notes,
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action: parsed.data.action,
      message:
        parsed.data.action === 'confirm'
          ? 'Stock availability confirmed. Customer notified.'
          : 'Assignment rejected. Admin notified for alternative routing.',
      po: result.po,
      order: result.order,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
