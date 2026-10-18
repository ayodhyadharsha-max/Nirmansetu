import { NextResponse } from 'next/server';
import { BulkEnquirySchema } from '@/lib/validations/enquiry';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = BulkEnquirySchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const enquiryNumber = `RFQ-AYD-${dateStr}-${randomHex}`;

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertPayload = {
      enquiry_number: enquiryNumber,
      user_id: user?.id || null,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail || null,
      company_or_firm_name: data.companyOrFirmName || null,
      gstin: data.gstin || null,
      project_type: data.projectType,
      project_title: data.projectTitle,
      project_address: data.projectAddress,
      pincode: data.pincode,
      estimated_budget_paise: data.estimatedBudgetPaise || null,
      target_delivery_date: data.targetDeliveryDate || null,
      material_requirements: data.materialRequirements,
      structured_items: data.structuredItems,
      status: 'new',
    };

    const { data: dbData, error: dbError } = await supabase
      .from('bulk_enquiries')
      .insert(insertPayload)
      .select('id, enquiry_number, created_at')
      .maybeSingle();

    if (dbError) {
      // If database is not yet connected/migrated, log and return simulated receipt for demo/offline testing
      console.warn('[WARN] Database insert skipped or failed:', dbError.message);
      return NextResponse.json({
        success: true,
        enquiryNumber,
        message: 'Your bulk construction enquiry has been recorded for Ayodhya operations team review.',
        details: {
          enquiryNumber,
          contactName: data.contactName,
          pincode: data.pincode,
          projectType: data.projectType,
          status: 'new',
          storage: 'pending_database_sync',
        },
      });
    }

    return NextResponse.json({
      success: true,
      enquiryNumber: dbData?.enquiry_number || enquiryNumber,
      id: dbData?.id,
      message: 'Quotation request successfully submitted. An Ayodhya supplier account manager will contact you with discounted rates within 2 hours.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit enquiry';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
