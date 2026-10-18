import { NextResponse } from 'next/server';
import { listCustomerAddresses, addCustomerAddress } from '@/lib/addresses/service';
import { AddressSchema } from '@/lib/validations/address';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
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
        { success: false, error: 'Authentication required to view addresses' },
        { status: 401 }
      );
    }

    const addresses = await listCustomerAddresses(userId);

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve addresses';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = AddressSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

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
        { success: false, error: 'Authentication required to save address' },
        { status: 401 }
      );
    }

    const res = await addCustomerAddress(userId, {
      addressType: parsed.data.addressType,
      siteOrPersonName: parsed.data.siteOrPersonName,
      contactPhone: parsed.data.contactPhone,
      alternatePhone: parsed.data.alternatePhone || undefined,
      streetAddress: parsed.data.streetAddress,
      landmark: parsed.data.landmark || undefined,
      pincode: parsed.data.pincode,
      city: parsed.data.city,
      state: parsed.data.state,
      unloadingInstructions: parsed.data.unloadingInstructions || undefined,
      hasTruckAccess: parsed.data.hasTruckAccess,
      isDefault: parsed.data.isDefault,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery site address saved successfully',
      address: res.address,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save address';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
