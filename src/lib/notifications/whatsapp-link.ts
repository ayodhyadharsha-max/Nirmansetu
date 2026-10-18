/**
 * NIRMANSETU: WHATSAPP CLICK-TO-CHAT LINK GENERATOR (CLIENT & SERVER SAFE)
 *
 * Generates standard WhatsApp Click-to-Chat URLs (https://wa.me/91...)
 * with automatic Indian 10-digit mobile phone normalization and URI encoding.
 */

export function buildWhatsAppClickToChatUrl(phone: string, text: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  } else if (clean.length === 12 && clean.startsWith('91')) {
    // Already has 91 country code
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
