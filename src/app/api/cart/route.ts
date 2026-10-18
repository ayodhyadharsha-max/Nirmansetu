import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
} from '@/lib/cart/service';
import { AddToCartSchema, UpdateCartItemSchema } from '@/lib/validations/cart';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId') || searchParams.get('sessionToken') || 'default-guest-cart';
    const pincode = searchParams.get('pincode') || undefined;

    const cart = await getCart(cartId, pincode);

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cart retrieval failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = AddToCartSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { variantId, quantity, pincode } = result.data;
    const cartId = json.cartId || json.sessionToken;

    // Check optional authenticated user
    let userId: string | undefined;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Optional auth
    }

    const addRes = await addItemToCart({
      cartId,
      sessionToken: json.sessionToken,
      userId,
      variantId,
      quantity,
      pincode,
    });

    if (!addRes.success) {
      return NextResponse.json(
        { success: false, error: addRes.error || 'Failed to add item to cart', cart: addRes.cart },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      cart: addRes.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cart mutation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const schema = z.object({
      cartId: z.string().min(1, 'Cart ID is required'),
      variantId: z.string().uuid('Invalid variant ID'),
      quantity: z.number().int().min(0, 'Quantity cannot be negative'),
    });

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { cartId, variantId, quantity } = parsed.data;
    const res = await updateItemQuantity({ cartId, variantId, quantity });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to update item quantity', cart: res.cart },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart quantity updated',
      cart: res.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cart update failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');
    const variantId = searchParams.get('variantId');

    if (!cartId || !variantId) {
      return NextResponse.json(
        { success: false, error: 'cartId and variantId query parameters are required' },
        { status: 400 }
      );
    }

    const res = await removeItemFromCart(cartId, variantId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
      cart: res.cart,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cart removal failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
