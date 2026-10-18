import { NextResponse } from 'next/server';
import { z } from 'zod';
import { memoryPincodes, updatePincodeConfigAdmin } from '@/lib/admin/service';
import { requireAdmin } from '@/lib/auth/roles';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const pincodes = Array.from(memoryPincodes.values());
    return NextResponse.json({ success: true, pincodes });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const UpdatePincodeSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
  isServiceable: z.boolean(),
  standardFeePaise: z.number().int().min(0).optional(),
  expressFeePaise: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = UpdatePincodeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const res = await updatePincodeConfigAdmin({
      pincode: parsed.data.pincode,
      isServiceable: parsed.data.isServiceable,
      standardFeePaise: parsed.data.standardFeePaise,
      expressFeePaise: parsed.data.expressFeePaise,
      adminSession,
    });

    return NextResponse.json({
      success: true,
      message: `PIN code ${parsed.data.pincode} delivery configuration updated.`,
      config: res.config,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
