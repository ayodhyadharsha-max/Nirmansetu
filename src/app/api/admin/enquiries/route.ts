import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roles';
import { listBulkEnquiries } from '@/lib/quotations/service';

export async function GET(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const enquiries = await listBulkEnquiries(adminSession);
    return NextResponse.json({ success: true, count: enquiries.length, enquiries });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
