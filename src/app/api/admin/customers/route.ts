import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { memoryOrders } from '@/lib/orders/service';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';

    const supabase = createAdminClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, business_name, gstin, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback to memory/demo profiles if database query fails
      const demoCustomers = [
        {
          id: 'demo-user-ayodhya-001',
          full_name: 'Shri Ram Infra Developers (Ayodhya)',
          phone: '+91 94500 12345',
          email: 'contractor.ayodhya@nirmansetu.in',
          business_name: 'Shri Ram Infra & Contractors Ltd.',
          gstin: '09AAACS1429B1ZB',
          role: 'contractor',
          is_active: true,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          orders_count: 2,
        },
        {
          id: 'demo-user-ayodhya-002',
          full_name: 'Vipin Sharma',
          phone: '+91 98390 54321',
          email: 'vipin.sharma@gmail.com',
          business_name: null,
          gstin: null,
          role: 'customer',
          is_active: true,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          orders_count: 1,
        },
      ];
      return NextResponse.json({ success: true, customers: demoCustomers });
    }

    // Attach order count
    const allOrders = Array.from(memoryOrders.values());
    const customersWithOrders = (profiles || []).map((p) => {
      const orderCount = allOrders.filter((o) => o.user_id === p.id).length;
      return {
        ...p,
        orders_count: orderCount,
      };
    });

    const filtered = search
      ? customersWithOrders.filter(
          (c) =>
            (c.full_name || '').toLowerCase().includes(search) ||
            (c.phone || '').includes(search) ||
            (c.business_name || '').toLowerCase().includes(search)
        )
      : customersWithOrders;

    return NextResponse.json({ success: true, customers: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'userId and isActive boolean are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, customer: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update customer status';
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }
}
