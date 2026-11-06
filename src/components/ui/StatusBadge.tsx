import { getStatusMeta } from '@/config/statuses'
import type { StatusKind, StatusKinds } from '@/types/status'
import { Badge } from './Badge'

export interface StatusBadgeProps<K extends StatusKind> {
  kind: K
  status: StatusKinds[K]
  size?: 'sm' | 'md'
  className?: string
}

/** Consistent label + colour for any domain status (orders, listings, deliveries…). */
export function StatusBadge<K extends StatusKind>({ kind, status, size, className }: StatusBadgeProps<K>) {
  const meta = getStatusMeta(kind, status)
  return (
    <Badge tone={meta.tone} dot size={size} title={meta.description} className={className}>
      {meta.label}
    </Badge>
  )
}
