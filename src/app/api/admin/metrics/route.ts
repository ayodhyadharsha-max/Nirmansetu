import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const metrics = await getDashboardMetrics();

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
