import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roles';
import { getAggregateWishlistReportAdmin } from '@/lib/wishlist/service';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const report = await getAggregateWishlistReportAdmin();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
