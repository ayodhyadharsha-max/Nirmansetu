import { NextResponse } from 'next/server';
import { listSupplierPurchaseOrders } from '@/lib/suppliers/service';
import { requireSupplier } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    const session = await requireSupplier(request);
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || session.supplierId;

    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const purchaseOrders = await listSupplierPurchaseOrders(supplierId, session);
    return NextResponse.json({
      success: true,
      supplierId,
      purchaseOrders,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
