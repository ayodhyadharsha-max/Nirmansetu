import { NextResponse } from 'next/server';
import { memorySuppliers, StoredSupplier } from '@/lib/suppliers/service';
import { requireAdmin } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const suppliersMap = new Map<string, StoredSupplier>();

    // 1. Fetch from Supabase
    try {
      const adminSupabase = createAdminClient();
      let query = adminSupabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (status) {
        query = query.eq('verification_status', status);
      }
      const { data: dbSuppliers } = await query;
      if (dbSuppliers && dbSuppliers.length > 0) {
        for (const s of dbSuppliers) {
          suppliersMap.set(s.id, s as any);
        }
      }
    } catch {
      // Handled
    }

    // 2. Supplement with memorySuppliers
    for (const s of Array.from(memorySuppliers.values())) {
      if (!suppliersMap.has(s.id)) {
        if (status && s.verification_status !== status) continue;
        suppliersMap.set(s.id, s);
      }
    }

    return NextResponse.json({
      success: true,
      suppliers: Array.from(suppliersMap.values()),
    });
  } catch (err: any) {
    const resStatus = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status: resStatus });
  }
}
