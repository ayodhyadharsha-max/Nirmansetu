import { NextResponse } from 'next/server';
import { memorySuppliers } from '@/lib/suppliers/service';
import { requireAdmin } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let suppliers = Array.from(memorySuppliers.values());
    if (status) {
      suppliers = suppliers.filter((s) => s.verification_status === status);
    }

    return NextResponse.json({
      success: true,
      suppliers,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
