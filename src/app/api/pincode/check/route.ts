import { NextResponse } from 'next/server';
import { checkDestinationServiceability } from '@/lib/logistics/serviceability';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode')?.trim();
  const subtotalParam = searchParams.get('subtotalPaise');
  const subtotalPaise = subtotalParam ? parseInt(subtotalParam, 10) : undefined;

  if (!pincode) {
    return NextResponse.json(
      { serviceable: false, error: 'PIN code query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await checkDestinationServiceability(pincode, subtotalPaise);

    // Maintain backwards compatibility with earlier frontend consumers while providing rich logistics data
    return NextResponse.json({
      serviceable: result.serviceable,
      pincode: result.pincode,
      areaName: result.hubLocality,
      zoneName: result.zoneName,
      city: 'Ayodhya',
      isCurrentlyOperating: result.isCurrentlyOperating,
      operatingHours: result.operatingHours,
      estimatedDeliveryMinutes: result.estimatedDelivery?.maxMinutes || 90,
      estimatedDelivery: result.estimatedDelivery,
      standardDeliveryFeePaise: result.deliveryFees?.standardDeliveryFeePaise ?? 19900,
      expressAvailable: (result.deliveryFees?.expressDeliveryFeePaise ?? 0) > 0,
      expressDeliveryFeePaise: result.deliveryFees?.expressDeliveryFeePaise ?? 0,
      freeDeliveryThresholdPaise: result.deliveryFees?.freeDeliveryThresholdPaise,
      isFreeDeliveryEligible: result.deliveryFees?.isFreeDeliveryEligible,
      orderMinimums: result.orderMinimums,
      deliveryRestrictions: result.deliveryRestrictions || [],
      maxVehicleCapacity: result.maxVehicleCapacity,
      unavailableNotice: result.unavailableNotice,
      message: result.unavailableNotice?.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal service error';
    return NextResponse.json({ serviceable: false, error: message }, { status: 500 });
  }
}
