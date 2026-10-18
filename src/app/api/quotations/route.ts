import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, requireAdmin } from '@/lib/auth/roles';
import {
  memoryQuotations,
  createCustomerQuotation,
} from '@/lib/quotations/service';

export async function GET(request: Request) {
  try {
    const session = await requireRole(['customer', 'contractor', 'admin'], request);
    let list = Array.from(memoryQuotations.values());

    if (session.role === 'customer') {
      list = list.filter((q) => q.user_id === session.id);
    }

    return NextResponse.json({ success: true, count: list.length, quotations: list });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const CreateQuoteSchema = z.object({
  enquiryId: z.string().min(1, 'Enquiry ID is required'),
  clientName: z.string().trim().min(2, 'Client name is required'),
  clientPhone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
  clientEmail: z.string().trim().email().optional(),
  clientGstin: z.string().trim().optional(),
  deliveryAddress: z.string().trim().min(5, 'Delivery address is required'),
  deliveryPincode: z.string().trim().regex(/^224\d{3}$/, 'Must be an Ayodhya PIN code'),
  validityDays: z.number().int().min(1).max(90).default(7),
  items: z.array(
    z.object({
      itemTitle: z.string().trim().min(2),
      unit: z.string().trim().min(1),
      quantity: z.number().positive(),
      unitRatePaise: z.number().int().positive(),
      gstRatePct: z.number().min(0).max(40).default(18),
    })
  ).min(1, 'At least one line item is required'),
  freightPaise: z.number().int().min(0).default(0),
  unloadingChargesPaise: z.number().int().min(0).default(0),
  termsAndConditions: z.string().trim().optional().default(''),
});

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin(request);
    const json = await request.json();
    const parsed = CreateQuoteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await createCustomerQuotation(parsed.data, adminSession);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Commercial quotation ${result.quotation?.quotation_number} generated successfully.`,
      quotation: result.quotation,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
