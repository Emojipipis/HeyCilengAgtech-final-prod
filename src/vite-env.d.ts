/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enables the clearly labelled Demo Preview Mode for dashboards. Developer-only. */
  readonly VITE_DEMO_MODE?: string
  /** Reserved for the future Supabase integration. Not used yet. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
