import { NextResponse } from 'next/server';
import { listUserOrders } from '@/lib/orders/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // Verify session
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Handled
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view order history' },
        { status: 401 }
      );
    }

    const orders = await listUserOrders(userId);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
