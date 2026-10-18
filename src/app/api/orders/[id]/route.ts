import { NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/orders/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    let requesterUserId = searchParams.get('userId');

    // Authenticated user check
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        requesterUserId = user.id;
      }
    } catch {
      // Handled
    }

    const res = await getOrderDetails(orderId, requesterUserId || undefined, false);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: res.order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
