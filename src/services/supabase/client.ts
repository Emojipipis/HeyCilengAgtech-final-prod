import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

const REMEMBER_KEY = 'heycileng-remember-session'

/**
 * "Remember me": persistent sessions use localStorage; otherwise the session lives in sessionStorage
 * and ends when the browser tab closes.
 */
export function setRememberSession(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    // Storage unavailable — fall back to the default (persistent) behaviour.
  }
}

function store() {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '0' ? sessionStorage : localStorage
  } catch {
    return undefined
  }
}

const authStorage = {
  getItem: (key: string) => store()?.getItem(key) ?? null,
  setItem: (key: string, value: string) => store()?.setItem(key, value),
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  },
}

/** Browser client. Uses only the public (publishable/anon) key — all authorisation is enforced by RLS. */
export const supabase = createClient(env.supabaseUrl || 'http://localhost', env.supabaseAnonKey || 'missing-key', {
  auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** The signed-in user's id, or null. */
export async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}
