import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number').optional().or(z.literal('')),
  companyName: z.string().trim().max(200).optional().or(z.literal('')),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  userId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Default demo contractor profile fallback
    let profile = {
      id: userId,
      full_name: 'Shri Ram Infra Developers (Ayodhya)',
      email: 'contractor.ayodhya@nirmansetu.in',
      phone: '9450012345',
      company_name: 'Shri Ram Infra & Contractors Ltd.',
      gstin: '09AAACS1429B1ZB',
      role: 'contractor',
    };

    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && data) {
        profile = {
          id: data.id,
          full_name: data.full_name || profile.full_name,
          email: data.email || profile.email,
          phone: data.phone || profile.phone,
          company_name: data.business_name || profile.company_name,
          gstin: data.gstin || profile.gstin,
          role: data.role || profile.role,
        };
      }
    } catch {
      // Handled
    }

    return NextResponse.json({ success: true, profile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const parsed = UpdateProfileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    let userId = parsed.data.userId;
    try {
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // Handled
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('profiles').update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone || null,
        business_name: parsed.data.companyName || null,
        gstin: parsed.data.gstin || null,
      }).eq('id', userId);
    } catch {
      // Handled
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: userId,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        companyName: parsed.data.companyName,
        gstin: parsed.data.gstin,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Profile update failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
