import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/roles';
import { dispatchOrderWithDelivery } from '@/lib/fulfillment/service';

const DispatchSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  poId: z.string().optional().default(''),
  driverName: z.string().trim().min(2, 'Driver name required'),
  driverPhone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Valid 10-digit driver mobile number required'),
  vehicleType: z.enum(['three_wheeler_auto', 'tata_ace', 'tata_407', 'tipper_truck', 'tractor_trolley']),
  vehicleRegistrationNumber: z.string().trim().min(4, 'Vehicle registration plate required'),
  deliveryInstructions: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['admin', 'supplier'], request);
    const json = await request.json();
    const parsed = DispatchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await dispatchOrderWithDelivery(
      parsed.data.orderId,
      parsed.data.poId,
      {
        driverName: parsed.data.driverName,
        driverPhone: parsed.data.driverPhone,
        vehicleType: parsed.data.vehicleType,
        vehicleRegistrationNumber: parsed.data.vehicleRegistrationNumber,
        deliveryInstructions: parsed.data.deliveryInstructions,
      },
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle dispatched. Drop-off OTP generated and customer notified.',
      delivery: result.delivery,
      order: result.order,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
