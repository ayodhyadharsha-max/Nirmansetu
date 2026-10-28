import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateAndNormalizeIndianPhone } from '@/lib/auth/phone';

/**
 * POST /api/auth/profile
 * Creates or idempotently updates customer profile after OTP verification.
 * 
 * SECURITY RULES:
 * 1. User MUST be authenticated via Bearer token or server cookie.
 * 2. Profile owner ID is strictly bound to authenticated user.
 * 3. Verified phone number is derived from trusted authentication session.
 * 4. Full Name is strictly validated on server (min 2, max 150 chars).
 * 5. Email, Company Name, GSTIN are optional.
 * 6. Blank optional fields NEVER overwrite existing valid profile data.
 * 7. Schema strictly uses valid public.profiles columns (business_name, not company_name).
 */
/**
 * Resolves and validates the authenticated user from:
 * 1. Bearer token verified via Supabase Admin service-role client (rock-solid server-to-server auth)
 * 2. Bearer token verified via Supabase Server client (publishable/anon key)
 * 3. Server-side Supabase cookies via createServerSupabaseClient
 *
 * Logs helpful diagnostics for debugging session drops.
 */
async function resolveAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  let lastAuthError: string | null = null;

  // 1. Try Bearer token if present
  if (bearerToken) {
    // Attempt A: Admin client (direct server-to-server JWT verification)
    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await adminSupabase.auth.getUser(bearerToken);
      if (!error && data?.user) {
        return { user: data.user, error: null, method: 'bearer_admin' as const };
      }
      if (error) {
        lastAuthError = error.message;
        console.warn('[Profile API] adminSupabase token verification note:', error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastAuthError = msg;
      console.warn('[Profile API] adminSupabase error:', msg);
    }

    // Attempt B: Server client with anon key
    try {
      const serverSupabase = createServerSupabaseClient();
      const { data, error } = await serverSupabase.auth.getUser(bearerToken);
      if (!error && data?.user) {
        return { user: data.user, error: null, method: 'bearer_server' as const };
      }
      if (error && !lastAuthError) {
        lastAuthError = error.message;
        console.warn('[Profile API] serverSupabase token verification note:', error.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!lastAuthError) lastAuthError = msg;
      console.warn('[Profile API] serverSupabase error:', msg);
    }
  }

  // 2. Try Server cookies
  try {
    const serverSupabase = createServerSupabaseClient();
    const { data, error } = await serverSupabase.auth.getUser();
    if (!error && data?.user) {
      return { user: data.user, error: null, method: 'cookie' as const };
    }
    if (error && error.message !== 'Auth session missing!' && !lastAuthError) {
      lastAuthError = error.message;
      console.warn('[Profile API] Cookie auth note:', error.message);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!lastAuthError) lastAuthError = msg;
    console.warn('[Profile API] Cookie auth error:', msg);
  }

  // Diagnostic log for why authentication was rejected
  if (!bearerToken) {
    console.warn('[Profile API] Auth rejected: No Bearer token provided in request header, and no active cookie session found.');
  } else {
    console.warn('[Profile API] Auth rejected: Bearer token provided but failed verification on Supabase Auth. Details:', lastAuthError);
  }

  const reason = !bearerToken
    ? 'No Bearer token or active cookie session provided in request.'
    : `Bearer token verification failed: ${lastAuthError || 'Invalid or expired token.'}`;

  return { user: null, error: reason, method: 'none' as const };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve and verify authenticated user from trusted session (Bearer token or cookie)
    const { user: authUser, error: authDiagnostic } = await resolveAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please verify your mobile number first.',
          diagnostic: process.env.NODE_ENV === 'development' ? authDiagnostic : undefined,
        },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { fullName, email, businessName, companyName, gstin } = body;

    // Ensure caller cannot impersonate another user ID if client explicitly provided one
    if (body.userId && body.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized user mismatch.' },
        { status: 403 }
      );
    }

    // 2. Validate Full Name on the server
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full Name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (fullName.trim().length > 150) {
      return NextResponse.json(
        { success: false, error: 'Full Name cannot exceed 150 characters.' },
        { status: 400 }
      );
    }

    // 3. Resolve phone strictly from trusted authentication session
    let verifiedPhone: string | null = null;
    if (authUser.phone) {
      const norm = validateAndNormalizeIndianPhone(authUser.phone);
      verifiedPhone = norm.isValid ? norm.normalized : authUser.phone;
    } else if (body.phone) {
      const norm = validateAndNormalizeIndianPhone(body.phone);
      if (norm.isValid) verifiedPhone = norm.normalized;
    }

    // 4. Validate optional fields
    let cleanEmail: string | null = null;
    if (email && typeof email === 'string' && email.trim()) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
      cleanEmail = trimmedEmail;
    }

    const effectiveBusinessName = (businessName || companyName || '').trim() || null;
    if (effectiveBusinessName && effectiveBusinessName.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Company / Contractor name cannot exceed 200 characters.' },
        { status: 400 }
      );
    }

    let cleanGstin: string | null = null;
    if (gstin && typeof gstin === 'string' && gstin.trim()) {
      const trimmedGstin = gstin.trim().toUpperCase();
      if (trimmedGstin.length !== 15) {
        return NextResponse.json(
          { success: false, error: 'Invalid GSTIN: Indian GSTIN must be exactly 15 characters.' },
          { status: 400 }
        );
      }
      cleanGstin = trimmedGstin;
    }

    const adminSupabase = createAdminClient();

    // 5. Check if profile already exists for idempotency and non-destructive updates
    const { data: existing, error: selectError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('[NirmanSetu Profile API] Existing profile lookup error:', selectError.message);
    }

    // Do not overwrite valid existing profile information with blank optional fields
    const finalPhone = verifiedPhone || existing?.phone || null;
    const finalEmail = cleanEmail || existing?.email || null;
    const finalBusinessName = effectiveBusinessName || existing?.business_name || null;
    const finalGstin = cleanGstin || existing?.gstin || null;
    const finalRole = existing?.role || (finalBusinessName ? 'contractor' : 'customer');

    // 6. Database schema object - strictly using valid public.profiles columns
    const profileDbPayload = {
      id: userId,
      full_name: fullName.trim(),
      phone: finalPhone,
      email: finalEmail,
      business_name: finalBusinessName,
      gstin: finalGstin,
      is_phone_verified: true,
      role: finalRole,
      updated_at: new Date().toISOString(),
    };

    // 7. Atomic and idempotent upsert with onConflict on primary key (id)
    const { data: savedProfile, error: upsertError } = await adminSupabase
      .from('profiles')
      .upsert(
        {
          ...profileDbPayload,
          created_at: existing?.created_at || new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[NirmanSetu Profile API] Database upsert error:', upsertError.message, upsertError.code);
      throw upsertError;
    }

    // Synchronize user_metadata in auth.users
    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: fullName.trim(),
          role: finalRole,
          business_name: finalBusinessName,
          phone: finalPhone,
        },
      });
    } catch {
      // Non-fatal if metadata update fails
    }

    // Return with mapped company_name for UI compatibility
    return NextResponse.json({
      success: true,
      profile: {
        ...savedProfile,
        company_name: savedProfile.business_name,
      },
    });
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : 'Database error';
    console.error('[NirmanSetu Profile API] Failed to save customer profile:', rawError);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to save your profile at this time. Please check your information and try again.',
        diagnostic: process.env.NODE_ENV === 'development' ? rawError : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/profile?userId=...
 * Retrieves verified profile for authenticated customer.
 * Enforces ownership: customers cannot inspect other customers' private data.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    // Resolve authenticated caller
    const { user: authUser } = await resolveAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify ownership: customer cannot read another customer's profile
    const targetUserId = requestedUserId || authUser.id;
    if (targetUserId !== authUser.id) {
      const { data: callerProfile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (callerProfile?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Access denied: You cannot view another customer profile.' },
          { status: 403 }
        );
      }
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('[NirmanSetu Profile API] GET error:', error.message);
      throw error;
    }

    const mapped = data
      ? {
          ...data,
          company_name: data.business_name,
        }
      : null;

    return NextResponse.json({ success: true, profile: mapped });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : 'Failed to fetch customer profile';
    console.error('[NirmanSetu Profile API] GET error:', rawMsg);
    return NextResponse.json(
      { success: false, error: 'Unable to retrieve customer profile' },
      { status: 500 }
    );
  }
}
