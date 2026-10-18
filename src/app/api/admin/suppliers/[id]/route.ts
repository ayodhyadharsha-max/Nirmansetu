import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateSupplierStatusAdmin } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

interface Params {
  params: { id: string };
}

const UpdateSupplierStatusSchema = z.object({
  status: z.enum(['verified', 'rejected', 'suspended']),
  commissionRatePct: z.number().min(0).max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const adminSession = await requireAdmin(request);
    const supplierId = params.id;
    const json = await request.json();
    const parsed = UpdateSupplierStatusSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await updateSupplierStatusAdmin({
      supplierId,
      newStatus: parsed.data.status,
      commissionRatePct: parsed.data.commissionRatePct,
      adminSession,
      notes: parsed.data.notes,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Supplier verification status updated to "${parsed.data.status}".`,
      supplier: res.supplier,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
