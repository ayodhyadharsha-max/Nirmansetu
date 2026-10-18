import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupplierProfile, updateSupplierProfile } from '@/lib/suppliers/service';
import { requireSupplier } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    const session = await requireSupplier(request);
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || session.supplierId;

    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const supplier = await getSupplierProfile(supplierId, session);
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      supplier,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const UpdateProfileSchema = z.object({
  supplierId: z.string().optional(),
  tradeName: z.string().trim().max(200).optional(),
  contactPerson: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().trim().email().optional(),
  streetAddress: z.string().trim().min(5).optional(),
  landmark: z.string().trim().optional(),
});

export async function PUT(request: Request) {
  try {
    const session = await requireSupplier(request);
    const json = await request.json();
    const parsed = UpdateProfileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supplierId = parsed.data.supplierId || session.supplierId;
    if (!supplierId) {
      return NextResponse.json({ success: false, error: 'Supplier ID required' }, { status: 400 });
    }

    const res = await updateSupplierProfile(supplierId, session, {
      trade_name: parsed.data.tradeName,
      contact_person: parsed.data.contactPerson,
      phone: parsed.data.phone,
      email: parsed.data.email,
      street_address: parsed.data.streetAddress,
      landmark: parsed.data.landmark,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier profile updated successfully',
      supplier: res.supplier,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
