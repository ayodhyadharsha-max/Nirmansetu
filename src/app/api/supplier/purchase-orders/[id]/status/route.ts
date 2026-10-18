import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateSupplierPoStatus } from '@/lib/suppliers/service';
import { requireSupplier } from '@/lib/auth/roles';
import { SupplierPoStatus } from '@/types/database';

const UpdatePoStatusSchema = z.object({
  supplierId: z.string().optional(),
  status: z.enum(['accepted', 'packed', 'dispatched', 'completed', 'cancelled'] as [SupplierPoStatus, ...SupplierPoStatus[]]),
  notes: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSupplier(request);
    const json = await request.json();
    const parsed = UpdatePoStatusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supplierId = parsed.data.supplierId || session.supplierId;
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const poId = params.id;
    const result = await updateSupplierPoStatus(
      poId,
      supplierId,
      session,
      parsed.data.status,
      parsed.data.notes
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Purchase Order status updated to ${parsed.data.status}`,
      po: result.po,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
