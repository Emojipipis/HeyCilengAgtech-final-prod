#!/usr/bin/env node
/**
 * Applies pending SQL migrations in supabase/migrations to the Supabase project, in filename order.
 *
 * Usage:  node scripts/db-push.mjs
 * Needs in .env.local (never committed):
 *   SUPABASE_ACCESS_TOKEN=sbp_…   personal access token (server-side only — never prefix with VITE_)
 *   SUPABASE_PROJECT_REF=…        project reference id
 *
 * Each migration runs in one transaction and is recorded in supabase_migrations_log,
 * so the script is safe to re-run.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function readEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/))
        .filter(Boolean)
        .map((m) => [m[1], m[2]]),
    )
  } catch {
    return {}
  }
}

const env = { ...readEnv('.env.local'), ...process.env }
const token = env.SUPABASE_ACCESS_TOKEN
const ref = env.SUPABASE_PROJECT_REF
if (!token || !ref) {
  console.error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env.local')
  process.exit(1)
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${body}`)
  return JSON.parse(body || '[]')
}

await query(`create table if not exists public.supabase_migrations_log (name text primary key, applied_at timestamptz not null default now());
alter table public.supabase_migrations_log enable row level security;`)
const applied = new Set((await query('select name from public.supabase_migrations_log')).map((r) => r.name))

const dir = 'supabase/migrations'
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
let count = 0
for (const file of files) {
  if (applied.has(file)) continue
  const sql = readFileSync(join(dir, file), 'utf8')
  process.stdout.write(`Applying ${file} … `)
  try {
    await query(`begin;\n${sql}\ninsert into public.supabase_migrations_log (name) values ('${file.replace(/'/g, "''")}');\ncommit;`)
    console.log('done')
    count++
  } catch (error) {
    console.log('FAILED')
    console.error(error.message)
    process.exit(1)
  }
}
console.log(count ? `${count} migration(s) applied.` : 'Database is up to date.')
