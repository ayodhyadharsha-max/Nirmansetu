import { NextResponse } from 'next/server';
import { getOrderDetails } from '@/lib/orders/service';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const orderId = params.id;
    const session = await getAuthenticatedServerSession(request);

    const requesterUserId = session?.id;
    const isAdmin = session?.role === 'admin';

    const res = await getOrderDetails(orderId, requesterUserId, isAdmin);

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
