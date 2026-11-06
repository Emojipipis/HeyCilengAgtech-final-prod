/**
 * Mirrors the database's contact_details_found(): buyers and sellers may not share phone numbers, emails,
 * links or social handles. The database enforces this; checking in the form just gives a clearer message sooner.
 */
export const CONTACT_DETAILS_MESSAGE = 'Remove contact details (phone numbers, emails, links or social handles). HeyCileng handles all communication between buyers and sellers.'

export function containsContactDetails(text: string | readonly string[] | undefined | null): boolean {
  const t = (Array.isArray(text) ? text.join(' ') : (text ?? '')).toString().toLowerCase()
  if (!t.trim()) return false
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(t)) return true
  if (/(https?:\/\/|www\.|wa\.me|t\.me\/|bit\.ly)/.test(t)) return true
  if (/[a-z0-9-]+\.(com|ng|net|org|io|info|biz)(\.ng)?\b/.test(t)) return true
  if (/(whats\s*app|telegram|instagram|facebook|snapchat|tiktok|twitter|signal app)/.test(t)) return true
  if (/(^|\s)@[a-z0-9_.]{3,}/.test(t)) return true
  if (/\b(call|text|dm|message|ring|reach|contact|whatsapp)\s+(me|us)\b/.test(t)) return true
  const digits = t.replace(/[\s\-.()]/g, '')
  if (/(\+?234|0)[789][01][0-9]{8}/.test(digits)) return true
  if (/[0-9]{10,}/.test(digits)) return true
  return false
}
