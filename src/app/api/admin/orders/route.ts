import { NextResponse } from 'next/server';
import { listAllOrdersAdmin } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const pincode = searchParams.get('pincode') || undefined;

    const orders = await listAllOrdersAdmin({ status, pincode });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
