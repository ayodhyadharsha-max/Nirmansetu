import { NextRequest, NextResponse } from 'next/server';
import { getUserWishlist, addToUserWishlist, removeFromUserWishlist } from '@/lib/wishlist/service';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedServerSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    // Admins can view another user's wishlist if userId is explicitly supplied for authorized support purposes
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const targetUserId = session.role === 'admin' && requestedUserId ? requestedUserId : session.id;

    const items = await getUserWishlist(targetUserId);
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch wishlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedServerSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Always link item to authenticated session.id
    await addToUserWishlist(session.id, productId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add to wishlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthenticatedServerSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let productId = searchParams.get('productId');

    if (!productId) {
      try {
        const body = await req.json();
        productId = body?.productId;
      } catch {
        // Body was empty
      }
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Always remove from session.id's wishlist
    await removeFromUserWishlist(session.id, productId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove from wishlist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
