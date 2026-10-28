import { NextResponse } from 'next/server';
import { RAZORPAY_CONFIG } from '@/lib/payments/razorpay';

export async function GET() {
  const isConfigured = RAZORPAY_CONFIG.isConfigured();

  return NextResponse.json({
    success: true,
    currency: 'INR',
    methods: [
      {
        id: 'cod',
        name: 'Pay on Site (COD)',
        description: 'Cash or UPI upon physical material inspection at jobsite with verified Drop-off PIN.',
        isAvailable: true,
        isDefault: true,
      },
      {
        id: 'razorpay',
        name: 'Online Payment (Razorpay / UPI)',
        description: 'Instant online settlement via UPI, debit/credit cards, and netbanking.',
        isAvailable: isConfigured,
        unavailableReason: isConfigured
          ? null
          : 'Online payment gateway is undergoing merchant verification with Razorpay India. Please use Pay on Site (COD).',
      },
      {
        id: 'neft_rtgs',
        name: 'Bank Transfer (NEFT / RTGS)',
        description: 'Wholesale and bulk contractor direct bank settlement with proforma invoice.',
        isAvailable: true,
      },
    ],
    gateway: {
      provider: 'razorpay',
      isConfigured,
      keyId: isConfigured ? RAZORPAY_CONFIG.keyId : null,
    },
  });
}
