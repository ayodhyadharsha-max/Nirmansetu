import { NextResponse } from 'next/server';
import { generateSafeCsvExport } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as 'orders' | 'suppliers' | 'products') || 'orders';

    if (!['orders', 'suppliers', 'products'].includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid export type. Must be orders, suppliers, or products.' }, { status: 400 });
    }

    const csvContent = generateSafeCsvExport(type);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nirmansetu_${type}_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
