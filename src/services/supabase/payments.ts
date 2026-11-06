import type { PaymentRecord } from '@/types/admin'
import type { PaymentService } from '../types'
import { supabase } from './client'
import { fail, ok } from './errors'

interface PaymentRow {
  id: string
  order_id: string
  buyer_id: string
  reference: string
  amount: number
  status: PaymentRecord['status']
  channel: string | null
  paid_at: string | null
  note: string | null
  created_at: string
}

/** Calls the `paystack` edge function as the signed-in user. Errors from the function carry a readable message. */
async function invokePaystack<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<T>('paystack', { body })
  if (!error) return ok(data as T)
  // FunctionsHttpError: the function's JSON body holds the message (e.g. "Order HC-1012 can't be paid yet").
  let message = 'The payment service couldn’t be reached. Please try again.'
  try {
    const context = (error as { context?: Response }).context
    const json = context ? await context.json() : null
    if (json?.error) message = json.error
  } catch {
    // keep the generic message
  }
  return { ok: false as const, error: { code: 'validation' as const, message } }
}

export const supabasePaymentService: PaymentService = {
  async listPayments() {
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500).returns<PaymentRow[]>()
    if (error) return fail(error)
    if (data.length === 0) return ok([])
    const [{ data: orders, error: orderError }, { data: people, error: peopleError }] = await Promise.all([
      supabase.from('orders').select('id, reference').in('id', [...new Set(data.map((p) => p.order_id))]),
      supabase.from('profiles').select('id, full_name, business_name, email').in('id', [...new Set(data.map((p) => p.buyer_id))]),
    ])
    if (orderError) return fail(orderError)
    if (peopleError) return fail(peopleError)
    const ref = new Map(orders.map((o) => [o.id as string, o.reference as string]))
    const name = new Map(people.map((p) => [p.id as string, (p.business_name || p.full_name || p.email) as string]))
    return ok(
      data.map((p) => ({
        id: p.id,
        orderId: p.order_id,
        orderReference: ref.get(p.order_id) ?? '',
        buyerName: name.get(p.buyer_id) ?? 'Unknown buyer',
        amount: Number(p.amount),
        status: p.status,
        provider: 'paystack' as const,
        reference: p.reference,
        channel: p.channel ?? undefined,
        paidAt: p.paid_at ?? undefined,
        note: p.note ?? undefined,
        createdAt: p.created_at,
      })),
    )
  },

  startCheckout(orderId) {
    return invokePaystack<{ authorizationUrl: string; reference: string }>({ action: 'start', orderId })
  },

  verifyPayment(reference) {
    return invokePaystack<{ status: 'paid' | 'failed' | 'pending' | 'refund_needed'; orderId: string }>({ action: 'verify', reference })
  },

  async markPayoutPaid(orderId, transferReference) {
    const { error } = await supabase.rpc('admin_mark_payout_paid', { p_order: orderId, p_reference: transferReference })
    return error ? fail(error) : ok(null)
  },

  async markRefunded(orderId, note) {
    const { error } = await supabase.rpc('admin_mark_refunded', { p_order: orderId, p_note: note })
    return error ? fail(error) : ok(null)
  },
}
