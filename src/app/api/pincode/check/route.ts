import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AYODHYA_REGIONAL_HUBS } from '@/config/brand';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode')?.trim();

  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json(
      { serviceable: false, error: 'Please enter a valid 6-digit PIN code' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('service_pincodes')
      .select('pincode, area_name, city, is_serviceable, estimated_delivery_minutes, standard_delivery_fee_paise, express_available, express_delivery_fee_paise')
      .eq('pincode', pincode)
      .maybeSingle();

    if (!error && data) {
      return NextResponse.json({
        serviceable: data.is_serviceable,
        pincode: data.pincode,
        areaName: data.area_name,
        city: data.city,
        estimatedDeliveryMinutes: data.estimated_delivery_minutes,
        standardDeliveryFeePaise: data.standard_delivery_fee_paise,
        expressAvailable: data.express_available,
        expressDeliveryFeePaise: data.express_delivery_fee_paise,
        source: 'database',
      });
    }

    // Fallback lookup against configured Ayodhya district hubs if database connection is pending
    const hub = AYODHYA_REGIONAL_HUBS.find((h) => h.pincode === pincode);
    if (hub) {
      return NextResponse.json({
        serviceable: true,
        pincode: hub.pincode,
        areaName: hub.coverage,
        city: 'Ayodhya',
        estimatedDeliveryMinutes: hub.slaMinutes,
        standardDeliveryFeePaise: 19900,
        expressAvailable: hub.isExpress,
        expressDeliveryFeePaise: hub.isExpress ? 39900 : 0,
        source: 'static_ayodhya_registry',
      });
    }

    return NextResponse.json({
      serviceable: false,
      pincode,
      message: `Delivery to ${pincode} is not currently active. We currently serve Ayodhya Dham, Faizabad, Darshannagar, Sohawal, and Bikapur.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal service error';
    return NextResponse.json({ serviceable: false, error: message }, { status: 500 });
  }
}
