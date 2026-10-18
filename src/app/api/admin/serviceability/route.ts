import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/roles';
import {
  listAllServicePincodesAdmin,
  updateServicePincodeConfigAdmin,
} from '@/lib/logistics/serviceability';

export async function GET(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const zones = await listAllServicePincodesAdmin(adminSession);
    return NextResponse.json({ success: true, count: zones.length, zones });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const UpdateZoneSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit PIN code'),
  zoneName: z.string().trim().min(3).optional(),
  hubLocality: z.string().trim().min(2).optional(),
  isServiceable: z.boolean().optional(),
  minOrderPaise: z.number().int().min(0).optional(),
  standardDeliveryFeePaise: z.number().int().min(0).optional(),
  freeDeliveryThresholdPaise: z.number().int().nullable().optional(),
  expressAvailable: z.boolean().optional(),
  expressDeliveryFeePaise: z.number().int().min(0).optional(),
  estimatedSlaMinMinutes: z.number().int().min(15).max(1440).optional(),
  estimatedSlaMaxMinutes: z.number().int().min(15).max(1440).optional(),
  operatingHours: z
    .object({
      open: z.string().regex(/^\d{2}:\d{2}$/),
      close: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .optional(),
  deliveryRestrictions: z.array(z.string()).optional(),
  maxVehicleCapacity: z
    .enum(['three_wheeler_auto', 'tata_ace', 'tata_407', 'tipper_truck', 'any'])
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = UpdateZoneSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pincode, ...updates } = parsed.data;
    const mappedUpdates: any = {};
    if (updates.zoneName !== undefined) mappedUpdates.zone_name = updates.zoneName;
    if (updates.hubLocality !== undefined) mappedUpdates.hub_locality = updates.hubLocality;
    if (updates.isServiceable !== undefined) mappedUpdates.is_serviceable = updates.isServiceable;
    if (updates.minOrderPaise !== undefined) mappedUpdates.min_order_paise = updates.minOrderPaise;
    if (updates.standardDeliveryFeePaise !== undefined)
      mappedUpdates.standard_delivery_fee_paise = updates.standardDeliveryFeePaise;
    if (updates.freeDeliveryThresholdPaise !== undefined)
      mappedUpdates.free_delivery_threshold_paise = updates.freeDeliveryThresholdPaise;
    if (updates.expressAvailable !== undefined) mappedUpdates.express_available = updates.expressAvailable;
    if (updates.expressDeliveryFeePaise !== undefined)
      mappedUpdates.express_delivery_fee_paise = updates.expressDeliveryFeePaise;
    if (updates.estimatedSlaMinMinutes !== undefined)
      mappedUpdates.estimated_sla_min_minutes = updates.estimatedSlaMinMinutes;
    if (updates.estimatedSlaMaxMinutes !== undefined)
      mappedUpdates.estimated_sla_max_minutes = updates.estimatedSlaMaxMinutes;
    if (updates.operatingHours !== undefined) mappedUpdates.operating_hours = updates.operatingHours;
    if (updates.deliveryRestrictions !== undefined)
      mappedUpdates.delivery_restrictions = updates.deliveryRestrictions;
    if (updates.maxVehicleCapacity !== undefined)
      mappedUpdates.max_vehicle_capacity = updates.maxVehicleCapacity;

    const result = await updateServicePincodeConfigAdmin(pincode, mappedUpdates, adminSession);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Logistics configuration for PIN code ${pincode} updated successfully.`,
      config: result.config,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
