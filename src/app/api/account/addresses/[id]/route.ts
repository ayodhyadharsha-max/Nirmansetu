import { NextResponse } from 'next/server';
import { deleteCustomerAddress } from '@/lib/addresses/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: { id: string };
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const addressId = params.id;
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

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

    const res = await deleteCustomerAddress(addressId, userId);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Address removed successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Address deletion failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
