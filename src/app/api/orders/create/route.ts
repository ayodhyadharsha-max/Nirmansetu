import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder } from '@/lib/orders/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedServerSession } from '@/lib/auth/roles';
import { RAZORPAY_CONFIG } from '@/lib/payments/razorpay';

function normalizeIndianPhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

const OrderSubmissionSchema = z.object({
  idempotencyKey: z.string().trim().max(100).optional(),
  cartId: z.string().min(1, 'Cart ID is required'),
  items: z.array(
    z.object({
      variantId: z.string().min(1, 'Product variant ID is required'),
      quantity: z.number().int().positive('Quantity must be greater than zero'),
    })
  ).optional(),
  customerDetails: z.object({
    name: z.string().trim().min(2, 'Customer name is required (minimum 2 characters)'),
    phone: z.preprocess(
      normalizeIndianPhone,
      z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number')
    ),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    companyName: z.string().trim().max(200).optional().or(z.literal('')),
    gstin: z.string().trim().max(15).optional().or(z.literal('')),
  }),
  deliveryAddress: z.object({
    addressType: z.enum(['site', 'residential', 'commercial']).default('site'),
    siteOrPersonName: z.string().trim().min(2, 'Site or receiver name is required'),
    contactPhone: z.preprocess(
      normalizeIndianPhone,
      z.string().regex(/^[6-9]\d{9}$/, 'Site contact must be a valid 10-digit mobile number')
    ),
    alternatePhone: z.preprocess(
      normalizeIndianPhone,
      z.string().regex(/^[6-9]\d{9}$/, 'Alternate contact must be a valid 10-digit mobile number').optional().or(z.literal(''))
    ),
    streetAddress: z.string().trim().min(5, 'Street address is too short (minimum 5 characters)'),
    landmark: z.string().trim().optional().or(z.literal('')),
    pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Must be a valid 6-digit Indian PIN code'),
    city: z.string().trim().default('Ayodhya'),
    state: z.string().trim().default('Uttar Pradesh'),
    unloadingInstructions: z.string().trim().max(500).optional().or(z.literal('')),
    hasTruckAccess: z.boolean().default(true),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'neft_rtgs', 'credit_line'], {
    required_error: 'Select a valid payment method (e.g. cod or razorpay)',
  }),
  isExpressDelivery: z.boolean().default(false),
  customerNotes: z.string().trim().max(500).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const rawJson = await request.json();

    // Harmonize legacy or inlineAddress payloads
    const json = { ...rawJson };
    if (!json.deliveryAddress && json.inlineAddress) {
      json.deliveryAddress = json.inlineAddress;
    }

    if (!json.customerDetails) {
      const addr = json.deliveryAddress || {};
      json.customerDetails = {
        name: addr.siteOrPersonName || 'Site Engineer',
        phone: addr.contactPhone || '',
        email: '',
        companyName: '',
        gstin: '',
      };
    } else if (json.deliveryAddress) {
      if (!json.deliveryAddress.siteOrPersonName && json.customerDetails.name) {
        json.deliveryAddress.siteOrPersonName = json.customerDetails.name;
      }
      if (!json.deliveryAddress.contactPhone && json.customerDetails.phone) {
        json.deliveryAddress.contactPhone = json.customerDetails.phone;
      }
    }

    const result = OrderSubmissionSchema.safeParse(json);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const messages: string[] = [];
      for (const [field, errs] of Object.entries(fieldErrors)) {
        if (Array.isArray(errs) && errs.length > 0) {
          messages.push(`${field}: ${errs[0]}`);
        }
      }
      const firstErrorMessage = messages[0] || 'Please check required fields and try again.';
      console.warn('[Orders Create] Validation failed:', JSON.stringify(fieldErrors));

      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${firstErrorMessage}`,
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = result.data;

    // Check prepaid payment method availability
    if (input.paymentMethod === 'razorpay') {
      const isGatewayConfigured = RAZORPAY_CONFIG.isConfigured();
      const allowTestPayments = process.env.ALLOW_TEST_PAYMENTS === 'true' || process.env.NODE_ENV === 'test';
      if (!isGatewayConfigured && !allowTestPayments) {
        return NextResponse.json(
          {
            success: false,
            error: "Online payment gateway is temporarily unavailable while Razorpay merchant KYC verification is underway. Please select 'Pay on Delivery (COD)' for immediate site dispatch.",
          },
          { status: 400 }
        );
      }
    }

    // Check optional authenticated user via Bearer token or cookies
    let userId: string | undefined;
    let isPhoneVerified = false;
    try {
      const session = await getAuthenticatedServerSession(request);
      if (session) {
        userId = session.id;
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('is_phone_verified, phone')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.is_phone_verified) {
          isPhoneVerified = true;
        } else {
          // Check auth user phone confirmed status
          const { data: authUserData } = await adminSupabase.auth.admin.getUserById(userId);
          if (authUserData?.user?.phone_confirmed_at) {
            isPhoneVerified = true;
          }
        }
      }
    } catch {
      // Optional guest checkout
    }

    const orderRes = await createOrder({
      idempotencyKey: input.idempotencyKey,
      cartId: input.cartId,
      userId,
      items: input.items,
      customerDetails: {
        name: input.customerDetails.name,
        phone: input.customerDetails.phone,
        email: input.customerDetails.email || undefined,
        companyName: input.customerDetails.companyName || undefined,
        gstin: input.customerDetails.gstin || undefined,
      },
      deliveryAddress: input.deliveryAddress,
      paymentMethod: input.paymentMethod,
      isExpressDelivery: input.isExpressDelivery,
      customerNotes: input.customerNotes || undefined,
    });

    if (!orderRes.success || !orderRes.order) {
      return NextResponse.json(
        { success: false, error: orderRes.error || 'Failed to place order' },
        { status: 400 }
      );
    }

    const order = orderRes.order;

    // SECURITY MANDATE:
    // Delivery OTP is ONLY exposed in the response if the creator has a verified phone session.
    // For unverified/guest submissions, deliveryOtp is strictly NULL in the response.
    // The OTP is sent via SMS directly to the delivery recipient upon supplier truck dispatch.
    const safeDeliveryOtp = isPhoneVerified ? order.delivery_otp_plain : null;
    const deliveryOtpNotice = isPhoneVerified
      ? 'Display your 4-digit drop-off verification PIN upon material inspection at jobsite.'
      : 'For security, your 4-digit material drop-off verification PIN will be dispatched via SMS directly to the recipient mobile number upon supplier truck dispatch.';

    return NextResponse.json({
      success: true,
      isDuplicate: orderRes.isDuplicate || false,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      totalPaise: order.total_paise,
      subtotalPaise: order.subtotal_paise,
      taxPaise: order.tax_paise,
      deliveryFeePaise: order.delivery_fee_paise,
      discountPaise: order.discount_paise,
      deliveryOtp: safeDeliveryOtp,
      deliveryOtpNotice,
      isPhoneVerified,
      message: orderRes.isDuplicate
        ? 'Duplicate order prevented. Existing order returned.'
        : 'Order successfully created and queued for approved Ayodhya supplier fulfillment.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order submission failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
