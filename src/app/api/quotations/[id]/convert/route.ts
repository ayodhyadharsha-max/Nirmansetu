import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/roles';
import { convertQuotationToOrder } from '@/lib/quotations/service';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['customer', 'contractor', 'admin'], request);
    const result = await convertQuotationToOrder(params.id, session);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Quotation successfully converted to live site order.',
      order: result.order,
      orderId: result.order?.id,
      orderNumber: result.order?.order_number,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
