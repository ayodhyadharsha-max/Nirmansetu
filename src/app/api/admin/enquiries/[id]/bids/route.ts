import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/roles';
import {
  recordSupplierRfqBid,
  listSupplierBidsAdmin,
} from '@/lib/quotations/service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['admin'], request);
    const bids = await listSupplierBidsAdmin(params.id, session);
    return NextResponse.json({ success: true, count: bids.length, bids });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const SubmitBidSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string().trim().min(2),
      unit_cost_paise: z.number().int().positive(),
      available_qty: z.number().positive(),
      lead_time_hours: z.number().int().min(1).optional().default(24),
      notes: z.string().optional(),
    })
  ).min(1, 'At least one item bid required'),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['supplier', 'admin'], request);
    const json = await request.json();
    const parsed = SubmitBidSchema.safeParse(json);

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

    const result = await recordSupplierRfqBid(
      params.id,
      supplierId,
      parsed.data.items,
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Private wholesale quotation bid submitted to platform administrator.',
      bid: result.bid,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
