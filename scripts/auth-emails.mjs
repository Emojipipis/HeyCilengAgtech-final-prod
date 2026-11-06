#!/usr/bin/env node
/**
 * Applies the email OTP settings and templates in supabase/templates to Supabase Auth.
 *
 * Usage:  node scripts/auth-emails.mjs
 * Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env.local (same as db-push.mjs).
 * Templates can only be changed when the project uses custom SMTP (Authentication → SMTP Settings).
 */
import { readFileSync } from 'node:fs'

const env = {
  ...Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  ),
  ...process.env,
}
if (!env.SUPABASE_ACCESS_TOKEN || !env.SUPABASE_PROJECT_REF) {
  console.error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env.local')
  process.exit(1)
}

const template = (name) => readFileSync(`supabase/templates/${name}.html`, 'utf8')

const config = {
  mailer_otp_length: 6,
  mailer_otp_exp: 600, // 10 minutes — matches the wording in the templates
  mailer_subjects_confirmation: 'Your HeyCileng verification code',
  mailer_templates_confirmation_content: template('confirmation'),
  mailer_subjects_recovery: 'Your HeyCileng password reset code',
  mailer_templates_recovery_content: template('recovery'),
  mailer_subjects_email_change: 'Confirm your new HeyCileng email address',
  mailer_templates_email_change_content: template('email_change'),
  mailer_subjects_reauthentication: 'Your HeyCileng confirmation code',
  mailer_templates_reauthentication_content: template('reauthentication'),
}

const res = await fetch(`https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(config),
})
if (!res.ok) {
  console.error(`Failed (${res.status}): ${await res.text()}`)
  process.exit(1)
}
console.log('Email OTP templates and settings applied.')
