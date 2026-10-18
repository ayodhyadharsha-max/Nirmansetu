import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/roles';
import {
  memoryQuotations,
  customerRespondToQuotation,
} from '@/lib/quotations/service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = memoryQuotations.get(params.id);

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quotation,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['customer', 'contractor', 'admin'], request);
    const json = await request.json();
    const parsed = RespondSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await customerRespondToQuotation(params.id, parsed.data.action, session);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message:
        parsed.data.action === 'accept'
          ? 'Quotation accepted. You can now convert this quotation into a live order.'
          : 'Quotation declined.',
      quotation: result.quotation,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
