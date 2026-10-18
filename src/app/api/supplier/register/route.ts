import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerSupplierApplication } from '@/lib/suppliers/service';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';

const SupplierRegistrationSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(200),
  tradeName: z.string().trim().max(200).optional(),
  contactPerson: z.string().trim().min(2, 'Contact person name required').max(150),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
  email: z.string().trim().email('Valid email address required'),
  streetAddress: z.string().trim().min(5, 'Physical stockist / depot address required'),
  landmark: z.string().trim().optional(),
  city: z.string().trim().default('Ayodhya'),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit PIN code'),
  state: z.string().trim().default('Uttar Pradesh'),
  gstin: z.string().trim().max(15).optional(),
  pan: z.string().trim().max(10).optional(),
  serviceablePincodes: z.array(z.string()).min(1, 'Select at least one serviceable postal code'),
  categoryInterests: z.array(z.string()).min(1, 'Select at least one product category'),
  brandAuthorizations: z.array(z.string()).optional(),
  minOrderQuantities: z.string().trim().optional(),
  deliveryCapacity: z.array(z.string()).min(1, 'Specify at least one delivery vehicle capability'),
  wholesaleCatalogNotes: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = SupplierRegistrationSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await getAuthenticatedServerSession(request);

    const result = await registerSupplierApplication({
      ...parsed.data,
      userId: session?.id || undefined,
    });

    return NextResponse.json({
      success: true,
      supplierId: result.supplierId,
      status: result.status,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
