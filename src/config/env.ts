/**
 * Typed access to build-time environment variables.
 * Only public, non-secret values belong here — anything prefixed VITE_ ships to the browser.
 */
export const env = {
  /** Developer-only flag. When true, dashboards load a labelled demo session. */
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
} as const

/** True once Supabase credentials are configured. The integration itself is a later phase. */
export const isBackendConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
