// Paystack webhook. Set this function's URL in Paystack → Settings → API Keys & Webhooks.
// Public endpoint (no Supabase JWT); every request is authenticated by Paystack's HMAC-SHA512 signature.
import { paystackKey, recordTransaction, type PaystackTransaction } from '../_shared/paystack.ts'

async function hmacSha512Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const raw = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''
  if (!signature || !safeEqual(await hmacSha512Hex(paystackKey(), raw), signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event: { event?: string; data?: PaystackTransaction }
  try {
    event = JSON.parse(raw)
  } catch {
    return new Response('Bad payload', { status: 400 })
  }

  try {
    if (event.event === 'charge.success' && event.data?.reference) {
      const outcome = await recordTransaction({ ...event.data, status: 'success' })
      console.log('paystack webhook', event.data.reference, outcome)
    }
    // Other events are acknowledged and ignored.
    return new Response('ok', { status: 200 })
  } catch (error) {
    // A non-2xx response makes Paystack retry later.
    console.error('paystack webhook error', error)
    return new Response('Error', { status: 500 })
  }
})
