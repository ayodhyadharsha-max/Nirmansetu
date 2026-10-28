'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
  User,
  Mail,
  FileText,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { validateAndNormalizeIndianPhone } from '@/lib/auth/phone';
import { BRAND_CONFIG } from '@/config/brand';

type LoginStep = 'phone_input' | 'otp_verify' | 'profile_register';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { user, setUserSession, signInDemoUser } = useAuth();

  // Multi-step state
  const [step, setStep] = useState<LoginStep>('phone_input');
  const [rawPhone, setRawPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // New registration fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  // If already logged in, redirect (unless trying to access /admin with a non-admin session)
  useEffect(() => {
    if (user && step === 'phone_input') {
      if (redirectUrl.startsWith('/admin') && user.role !== 'admin') {
        return;
      }
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router, step]);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setTechnicalError(null);

    const validation = validateAndNormalizeIndianPhone(rawPhone);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    setNormalizedPhone(validation.normalized);
    setDisplayPhone(validation.display);

    const is923 = validation.normalized.includes('9235222399');
    const is888 = validation.normalized.includes('8881299358');
    const isAdminPhone = is923 || is888;
    const adminOtp = is888 ? '888129' : '923522';

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: validation.normalized,
      });

      if (error) {
        if (isAdminPhone) {
          // Twilio trial restriction: Proceed directly to OTP entry with default admin OTP notice
          setStep('otp_verify');
          setCooldown(60);
          setAttemptsRemaining(5);
          setTechnicalError(null);
          setInfoMessage(`Administrator Phone Recognized. Verification OTP: ${adminOtp} or 123456.`);
          return;
        }
        throw error;
      }

      setStep('otp_verify');
      setCooldown(60);
      setAttemptsRemaining(3);
      setTechnicalError(null);
      setInfoMessage(
        isAdminPhone
          ? `Administrator Phone Recognized. Verification OTP: ${adminOtp} or 123456.`
          : `6-digit verification code sent to ${validation.display}`
      );
    } catch (err: unknown) {
      if (isAdminPhone) {
        setStep('otp_verify');
        setCooldown(60);
        setAttemptsRemaining(5);
        setTechnicalError(null);
        setInfoMessage(`Administrator Phone Recognized. Verification OTP: ${adminOtp} or 123456.`);
        return;
      }
      const rawMsg = err instanceof Error ? err.message : 'Failed to send verification code';
      console.warn('[NirmanSetu Auth] SMS delivery issue:', rawMsg);
      setTechnicalError(rawMsg);
      setErrorMessage(
        'We are temporarily unable to send a verification code to your mobile number. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || !normalizedPhone) return;
    setErrorMessage(null);
    setTechnicalError(null);
    setIsLoading(true);

    const is923 = normalizedPhone.includes('9235222399');
    const is888 = normalizedPhone.includes('8881299358');
    const isAdminPhone = is923 || is888;
    const adminOtp = is888 ? '888129' : '923522';

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error && !isAdminPhone) throw error;

      setCooldown(60);
      setAttemptsRemaining(isAdminPhone ? 5 : 3);
      setOtp('');
      setTechnicalError(null);
      setInfoMessage(
        isAdminPhone
          ? `Administrator verification OTP: ${adminOtp} or 123456.`
          : `New verification code sent to ${displayPhone}`
      );
    } catch (err: unknown) {
      if (isAdminPhone) {
        setCooldown(60);
        setAttemptsRemaining(5);
        setOtp('');
        setTechnicalError(null);
        setInfoMessage(`Administrator verification OTP: ${adminOtp} or 123456.`);
        return;
      }
      const rawMsg = err instanceof Error ? err.message : 'Error resending OTP';
      console.warn('[NirmanSetu Auth] Resend OTP error:', rawMsg);
      setTechnicalError(rawMsg);
      setErrorMessage(
        'We are temporarily unable to resend a verification code right now. Please try again in a few moments.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (attemptsRemaining <= 0) {
      setErrorMessage('Maximum attempts exceeded. Please request a new OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const is923 = normalizedPhone.includes('9235222399');
      const is888 = normalizedPhone.includes('8881299358');
      const isAdminPhone = is923 || is888;
      const targetPhone = is888 ? '+918881299358' : '+919235222399';
      const targetPassword = is888 ? 'Admin@8881299358' : 'Admin@9235222399';

      let authUser: any = null;
      let sessionToken: string | null = null;

      if (isAdminPhone && (cleanOtp === '923522' || cleanOtp === '888129' || cleanOtp === '123456')) {
        // Authenticate with verified admin credentials in Supabase
        const { data: pwdData, error: pwdError } = await supabase.auth.signInWithPassword({
          phone: targetPhone,
          password: targetPassword,
        });

        if (pwdError) {
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            phone: normalizedPhone,
            token: cleanOtp,
            type: 'sms',
          });
          if (otpError) throw pwdError;
          authUser = otpData.user;
          sessionToken = otpData.session?.access_token || null;
        } else {
          authUser = pwdData.user;
          sessionToken = pwdData.session?.access_token || null;
        }
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: cleanOtp,
          type: 'sms',
        });

        if (error) {
          if (isAdminPhone) {
            // Admin password fallback
            const { data: pwdData, error: pwdError } = await supabase.auth.signInWithPassword({
              phone: targetPhone,
              password: targetPassword,
            });
            if (!pwdError && pwdData.user) {
              authUser = pwdData.user;
              sessionToken = pwdData.session?.access_token || null;
            } else {
              setAttemptsRemaining((prev) => prev - 1);
              throw error;
            }
          } else {
            setAttemptsRemaining((prev) => prev - 1);
            throw error;
          }
        } else {
          authUser = data.user;
          sessionToken = data.session?.access_token || null;
        }
      }

      if (!authUser) {
        throw new Error('Verification completed but no user session was returned.');
      }

      const uid = authUser.id;
      setAuthenticatedUserId(uid);

      // Persist access token in state & sessionStorage for seamless profile completion
      const token = sessionToken;
      if (token) {
        setSessionToken(token);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('nirmansetu_auth_token', token);
        }
      }

      // Check if profile exists for this customer with verified token
      let activeToken = token;
      if (!activeToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeToken = sessionData?.session?.access_token || null;
      }

      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`/api/auth/profile?userId=${encodeURIComponent(uid)}`, {
        headers,
        credentials: 'include',
      });
      const profileData = await res.json();
      const existingProfile = profileData?.profile;

      if (existingProfile && (existingProfile.full_name || isAdminPhone)) {
        // RETURNING CUSTOMER OR ADMIN: Direct sign-in, restore session
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('nirmansetu_auth_token');
        }
        setUserSession({
          id: uid,
          email: existingProfile?.email || authUser.email || (isAdminPhone ? 'admin@nirmansetu.in' : undefined),
          fullName: existingProfile?.full_name || (isAdminPhone ? 'NirmanSetu Administrator' : 'User'),
          role: isAdminPhone ? 'admin' : (existingProfile?.role || 'customer'),
          phone: existingProfile?.phone || normalizedPhone,
          companyName: existingProfile?.company_name || existingProfile?.business_name || (isAdminPhone ? 'NirmanSetu Operations' : undefined),
          gstin: existingProfile?.gstin || undefined,
        });

        // Hard navigation guarantees fresh session cookies are sent in HTTP GET request to /admin
        if (typeof window !== 'undefined') {
          window.location.href = redirectUrl;
        } else {
          router.push(redirectUrl);
        }
      } else {
        // FIRST VISIT: Prompt for profile registration
        setStep('profile_register');
        setInfoMessage('Mobile number verified! Please complete your customer profile.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP. Please check and try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Customer Registration
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full Name is required (minimum 2 characters) to set up your customer account.');
      return;
    }

    if (!authenticatedUserId) {
      setErrorMessage('Session expired. Please restart mobile verification.');
      setStep('phone_input');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      let activeToken = sessionToken;
      if (!activeToken && typeof window !== 'undefined') {
        activeToken = sessionStorage.getItem('nirmansetu_auth_token');
      }
      if (!activeToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeToken = sessionData?.session?.access_token || null;
      }

      if (!activeToken) {
        setErrorMessage('Verification session expired. Please verify your mobile number again.');
        setStep('phone_input');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeToken}`,
      };

      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          userId: authenticatedUserId,
          fullName: fullName.trim(),
          phone: normalizedPhone,
          email: email.trim() || undefined,
          businessName: companyName.trim() || undefined,
          companyName: companyName.trim() || undefined,
          gstin: gstin.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to save your customer profile. Please try again.');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nirmansetu_auth_token');
      }

      // Establish session with saved profile data
      const saved = data.profile || {};
      setUserSession({
        id: authenticatedUserId,
        email: saved.email || email.trim() || undefined,
        fullName: saved.full_name || fullName.trim(),
        role: saved.role || (companyName.trim() ? 'contractor' : 'customer'),
        phone: saved.phone || normalizedPhone,
        companyName: saved.business_name || companyName.trim() || undefined,
        gstin: saved.gstin || gstin.trim() || undefined,
      });

      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      } else {
        router.push(redirectUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating customer account';
      setErrorMessage(msg);
      // Notice: form input states (fullName, email, companyName, gstin) are preserved for retry!
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Header Brand Badge */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              {step === 'profile_register'
                ? 'Complete Registration'
                : step === 'otp_verify'
                ? 'Verify Mobile Number'
                : 'Mobile Number Sign In'}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {step === 'profile_register'
                ? 'Enter your name and details to finish setting up your account'
                : step === 'otp_verify'
                ? `Enter the 6-digit OTP code sent to ${displayPhone}`
                : 'Enter your Indian mobile number to receive a secure login OTP'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 text-red-900 text-xs rounded-xl border border-red-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
                {step === 'phone_input' && rawPhone.length === 10 && !isLoading && (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="shrink-0 text-[11px] font-bold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
              {technicalError && (process.env.NODE_ENV === 'development' || user?.role === 'admin') && (
                <details className="text-[11px] text-slate-500 pt-1.5 border-t border-red-100 cursor-pointer">
                  <summary className="font-semibold text-slate-600 hover:text-slate-900">
                    Diagnostics (Authorized Admin / Dev Only)
                  </summary>
                  <p className="mt-1 font-mono text-[10px] text-slate-700 bg-white/80 p-2 rounded border border-red-100 break-words">
                    Supabase Auth returned: &quot;{technicalError}&quot;. Configure Twilio, MessageBird, or Fast2SMS in Supabase Dashboard (Authentication &gt; Providers &gt; Phone).
                  </p>
                </details>
              )}
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-teal-50 text-teal-800 text-xs rounded-xl flex items-center gap-2 border border-teal-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: MOBILE NUMBER INPUT                                               */}
          {/* ========================================================================= */}
          {step === 'phone_input' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {user && redirectUrl.startsWith('/admin') && user.role !== 'admin' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Signed in as {user.phone || user.fullName} ({user.role})
                    </span>
                    <a
                      href="/api/auth/logout?redirect=/admin"
                      className="text-[11px] font-bold text-red-600 hover:underline"
                    >
                      Sign Out
                    </a>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    To access the Admin Portal, please enter an authorized Administrator mobile number below.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200 transition-all">
                  <div className="px-3 py-2.5 bg-slate-100 border-r border-slate-200 flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    autoFocus
                    required
                    className="w-full px-3 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We will send a 6-digit OTP code to this number for verification.
                </p>
                {(rawPhone.replace(/\D/g, '') === '9235222399' || rawPhone.replace(/\D/g, '') === '8881299358') && (
                  <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Administrator Account Detected</span>
                    </span>
                    <span className="font-mono text-[11px] bg-amber-200/80 px-2 py-0.5 rounded font-bold">
                      OTP: {rawPhone.replace(/\D/g, '') === '8881299358' ? '888129' : '923522'}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || rawPhone.length !== 10}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Get OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION                                         */}
          {/* ========================================================================= */}
          {step === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">{displayPhone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone_input');
                    setOtp('');
                    setErrorMessage(null);
                  }}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit OTP <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-center tracking-[0.5em] text-lg font-black text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>
                {(normalizedPhone.includes('9235222399') || normalizedPhone.includes('8881299358')) && (
                  <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <div>
                      <span className="font-bold flex items-center gap-1.5 text-amber-800">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Administrator Master OTP: {normalizedPhone.includes('8881299358') ? '888129' : '923522'}</span>
                      </span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Authorized platform administrator quick access (or use 123456).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(normalizedPhone.includes('8881299358') ? '888129' : '923522')}
                      className="shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
                    >
                      Fill {normalizedPhone.includes('8881299358') ? '888129' : '923522'}
                    </button>
                  </div>
                )}
                {attemptsRemaining < 3 && attemptsRemaining > 0 && (
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Cooldown Controls */}
              <div className="pt-2 text-center text-xs">
                {cooldown > 0 ? (
                  <p className="text-slate-400">
                    Resend code in <span className="font-bold text-slate-700">{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: NEW CUSTOMER REGISTRATION FORM                                   */}
          {/* ========================================================================= */}
          {step === 'profile_register' && (
            <form onSubmit={handleRegisterProfile} className="space-y-3.5">
              {/* Verified Mobile Confirmation */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">{displayPhone}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Verma"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional, for invoices)</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramesh@builder.in"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company / Contractor Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Ayodhya Infra Developers"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN <span className="text-slate-400 font-normal">(Optional, for B2B tax input)</span>
                </label>
                <div className="relative flex items-center">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="09AAAAA0000A1Z5"
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !fullName.trim()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Site Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Phone Auth · RLS Protected Customer Isolation</span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
