import { NextResponse } from 'next/server';
import { setDefaultAddress } from '@/lib/addresses/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: { id: string };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const addressId = params.id;
    const json = await request.json().catch(() => ({}));
    let userId = json.userId;

    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const res = await setDefaultAddress(addressId, userId);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default delivery site updated',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update default address';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
