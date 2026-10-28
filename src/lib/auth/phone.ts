/**
 * NIRMANSETU: INDIAN MOBILE PHONE NORMALIZATION & VALIDATION
 *
 * Normalizes Indian phone numbers to E.164 standard (+91XXXXXXXXXX)
 * Validates 10-digit Indian mobile range starting with 6, 7, 8, or 9.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  display: string;
  rawDigits: string;
  error?: string;
}

export function validateAndNormalizeIndianPhone(input: string): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalized: '',
      display: '',
      rawDigits: '',
      error: 'Please enter a valid mobile number.',
    };
  }

  // Remove non-digit characters except leading plus
  let cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

  // Handle +91 or 91 prefix
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Check if exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      display: input,
      rawDigits: cleaned,
      error: 'Indian mobile numbers must be exactly 10 digits.',
    };
  }

  // Must begin with 6, 7, 8, or 9 (TRAI standard)
  if (!/^[6-9]/.test(cleaned)) {
    return {
      isValid: false,
      normalized: '',
      display: input,
      rawDigits: cleaned,
      error: 'Valid Indian mobile numbers must begin with 6, 7, 8, or 9.',
    };
  }

  const normalized = `+91${cleaned}`;
  const display = `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;

  return {
    isValid: true,
    normalized,
    display,
    rawDigits: cleaned,
  };
}
