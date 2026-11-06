// Buyer-facing Paystack actions. Requires the buyer's Supabase session (JWT verified by the platform).
//   { action: 'start', orderId }   → { authorizationUrl, reference }   (redirect the buyer to Paystack)
//   { action: 'verify', reference } → { status: 'paid' | 'failed' | 'pending', orderId }
// The amount is always computed by the database (prepare_payment), never taken from the browser.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PAYSTACK_API, paystackKey, recordTransaction, serviceClient, type PaystackTransaction } from '../_shared/paystack.ts'

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((o) => o.trim()).filter(Boolean)

function cors(origin: string | null) {
  const allow = origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] ?? '')
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  const headers = { ...cors(origin), 'Content-Type': 'application/json' }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed.' })

  // Act as the signed-in buyer so database functions and RLS see auth.uid().
  const buyer = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  })

  let body: { action?: string; orderId?: string; reference?: string }
  try {
    body = await req.json()
  } catch {
    return reply(400, { error: 'Invalid request.' })
  }

  try {
    if (body.action === 'start' && body.orderId) {
      const { data, error } = await buyer.rpc('prepare_payment', { p_order: body.orderId })
      if (error) return reply(400, { error: error.message })
      const payment = (data as { reference: string; amount: number; email: string; order_reference: string }[])[0]

      // Send the buyer back to the site they came from (only known origins).
      const site = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
      const returnUrl = `${site}/buyer/orders/${body.orderId}?payment=return&reference=${encodeURIComponent(payment.reference)}`

      const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${paystackKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payment.email,
          amount: Math.round(Number(payment.amount) * 100),
          currency: 'NGN',
          reference: payment.reference,
          callback_url: returnUrl,
          metadata: { order_id: body.orderId, order_reference: payment.order_reference, cancel_action: `${returnUrl}&cancelled=1` },
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.status) {
        await serviceClient().rpc('record_payment_failure', { p_reference: payment.reference, p_reason: `Initialisation failed: ${json.message ?? res.status}` })
        return reply(502, { error: 'Paystack couldn’t start the payment. Please try again shortly.' })
      }
      return reply(200, { authorizationUrl: json.data.authorization_url, reference: payment.reference })
    }

    if (body.action === 'verify' && body.reference) {
      // RLS: buyers only see their own payments, so this also checks ownership.
      const { data: payment, error } = await buyer.from('payments').select('order_id, status').eq('reference', body.reference).maybeSingle()
      if (error) return reply(400, { error: error.message })
      if (!payment) return reply(404, { error: 'Payment not found.' })
      if (payment.status === 'successful') return reply(200, { status: 'paid', orderId: payment.order_id })

      const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(body.reference)}`, {
        headers: { Authorization: `Bearer ${paystackKey()}` },
      })
      const json = await res.json()
      if (!res.ok || !json.status) return reply(200, { status: 'pending', orderId: payment.order_id })
      const outcome = await recordTransaction(json.data as PaystackTransaction)
      const status = outcome === 'recorded' || outcome === 'already_recorded' ? 'paid' : outcome === 'failed' || outcome === 'mismatch' ? 'failed' : outcome === 'refund_needed' ? 'refund_needed' : 'pending'
      return reply(200, { status, orderId: payment.order_id })
    }

    return reply(400, { error: 'Unknown action.' })
  } catch (error) {
    console.error('paystack function error', error)
    return reply(500, { error: 'Something went wrong with the payment. Please try again.' })
  }
})
