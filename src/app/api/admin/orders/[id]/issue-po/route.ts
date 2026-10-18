import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueSupplierPoAdmin } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

interface Params {
  params: { id: string };
}

const IssuePoSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const adminSession = await requireAdmin(request);
    const orderId = params.id;
    const json = await request.json();
    const parsed = IssuePoSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await issueSupplierPoAdmin({
      orderId,
      supplierId: parsed.data.supplierId,
      notes: parsed.data.notes,
      adminSession,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Supplier purchase order ${res.po?.po_number} issued successfully.`,
      po: res.po,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
