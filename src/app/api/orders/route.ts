import { NextResponse } from 'next/server';
import { listUserOrders } from '@/lib/orders/service';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Verify session strictly via server session (Bearer token or cookie)
    const session = await getAuthenticatedServerSession(request);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view order history. Please log in.' },
        { status: 401 }
      );
    }

    // Customer isolation check:
    // Regular customers can ONLY view their own orders.
    // Platform administrators can view orders for any customer by supplying userId.
    let targetUserId = session.id;
    if (requestedUserId && requestedUserId !== session.id) {
      if (session.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Access denied: You are not authorized to view orders belonging to another customer.' },
          { status: 403 }
        );
      }
      targetUserId = requestedUserId;
    }

    const orders = await listUserOrders(targetUserId);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order history';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
