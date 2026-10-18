import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/roles';
import { reconcilePoQuantities } from '@/lib/fulfillment/service';

const ReconcileSchema = z.object({
  poId: z.string().min(1, 'PO ID required'),
  supplierInvoiceNumber: z.string().trim().min(2, 'Supplier invoice number required'),
  reconciliations: z.array(
    z.object({
      variant_id: z.string().min(1),
      ordered_quantity: z.number().int().min(0),
      supplied_quantity: z.number().int().min(0),
      unit_cost_paise: z.number().int().min(0),
      reconciliation_notes: z.string().optional(),
    })
  ).min(1, 'At least one item required for reconciliation'),
});

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = ReconcileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await reconcilePoQuantities(
      parsed.data.poId,
      parsed.data.reconciliations,
      parsed.data.supplierInvoiceNumber,
      adminSession
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.discrepancyFound
        ? `PO reconciled with ${result.discrepancies.length} discrepancy item(s).`
        : 'PO quantities perfectly reconciled with zero discrepancy.',
      discrepancyFound: result.discrepancyFound,
      discrepancies: result.discrepancies,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
