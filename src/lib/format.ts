import { UNITS } from '@/config/catalog'
import { PLATFORM } from '@/config/platform'
import type { Unit } from '@/types/catalog'

const currency = new Intl.NumberFormat(PLATFORM.locale, { style: 'currency', currency: PLATFORM.currency, maximumFractionDigits: 0 })
const number = new Intl.NumberFormat(PLATFORM.locale, { maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat(PLATFORM.locale, { day: 'numeric', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat(PLATFORM.locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const formatCurrency = (value: number) => currency.format(value)
export const formatNumber = (value: number) => number.format(value)

/** "12 tonnes", "1 tonne", "40 bags" */
export function formatQuantity(value: number, unit: Unit) {
  const meta = UNITS[unit]
  const word = unit === 'kg' ? 'kg' : value === 1 ? meta.label.split(' ')[0].toLowerCase() : meta.plural
  return `${formatNumber(value)} ${word}`
}

/** "₦45,000 / tonne" */
export function formatUnitPrice(value: number, unit: Unit) {
  const word = unit === 'kg' ? 'kg' : unit === 'tonne' ? 'tonne' : 'bag'
  return `${formatCurrency(value)} / ${word}`
}

export const formatDate = (iso: string) => date.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))

export function formatRelative(iso: string, now = Date.now()) {
  const diff = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

/** Today as yyyy-mm-dd in local time. */
export function todayISODate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
