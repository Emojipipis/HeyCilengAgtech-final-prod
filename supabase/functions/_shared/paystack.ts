// Shared helpers for the Paystack edge functions. The secret key is read from the function's
// environment (Supabase secret PAYSTACK_SECRET_KEY) and never leaves the server.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const PAYSTACK_API = 'https://api.paystack.co'

export function paystackKey(): string {
  const key = Deno.env.get('PAYSTACK_SECRET_KEY')
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set for this project.')
  return key
}

/** Client acting as the backend (bypasses RLS). Only used for record_payment / record_payment_failure. */
export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
}

export interface PaystackTransaction {
  id: number
  reference: string
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending' | 'reversed' | string
  amount: number
  currency: string
  channel: string
  paid_at: string | null
  gateway_response?: string
}

/** Records a transaction Paystack reported. Amount and currency are checked again in the database. */
export async function recordTransaction(tx: PaystackTransaction): Promise<string> {
  const db = serviceClient()
  if (tx.status === 'success') {
    const { data, error } = await db.rpc('record_payment', {
      p_reference: tx.reference,
      p_amount_kobo: tx.amount,
      p_currency: tx.currency,
      p_transaction_id: String(tx.id),
      p_channel: tx.channel,
      p_paid_at: tx.paid_at,
    })
    if (error) throw error
    return data as string
  }
  if (tx.status === 'failed' || tx.status === 'reversed') {
    const { error } = await db.rpc('record_payment_failure', { p_reference: tx.reference, p_reason: tx.gateway_response ?? `Paystack status: ${tx.status}` })
    if (error) throw error
    return 'failed'
  }
  return 'pending'
}
