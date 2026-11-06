import { CalendarDays, CircleCheckBig, Ellipsis, MapPin, Pause, Pencil, Play, Sparkles, Trash } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Dropdown } from '@/components/ui/Dropdown'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { APPLICATIONS, CATEGORY_BY_ID, QUALITY_TAGS, UNITS } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format'
import { effectiveRequirementStatus } from '@/lib/requirements'
import type { Requirement } from '@/types/requirement'
import type { RequirementStatus } from '@/types/status'

interface RequirementCardProps {
  requirement: Requirement
  matchesPath: string
  onEdit: () => void
  onSetStatus: (status: Exclude<RequirementStatus, 'expired'>) => void
  onDelete: () => void
  /** Recommended listings for this requirement, when known. */
  matchCount?: { total: number; full: number }
}

export function RequirementCard({ requirement: r, matchesPath, onEdit, onSetStatus, onDelete, matchCount }: RequirementCardProps) {
  const status = effectiveRequirementStatus(r)
  const category = CATEGORY_BY_ID[r.category]
  const Icon = category.icon
  const unit = UNITS[r.unit].label.split(' ')[0].toLowerCase()

  const items = [
    { key: 'edit', label: 'Edit', icon: <Pencil />, onSelect: onEdit },
    ...(status === 'active' ? [{ key: 'pause', label: 'Pause matching', icon: <Pause />, onSelect: () => onSetStatus('paused') }] : []),
    ...(status === 'paused' ? [{ key: 'resume', label: 'Resume matching', icon: <Play />, onSelect: () => onSetStatus('active') }] : []),
    ...(status !== 'fulfilled' ? [{ key: 'fulfil', label: 'Mark as fulfilled', icon: <CircleCheckBig />, onSelect: () => onSetStatus('fulfilled') }] : []),
    { key: 'delete', label: 'Delete', icon: <Trash />, tone: 'danger' as const, onSelect: onDelete },
  ]

  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ochre-100 text-ochre-700 dark:bg-ochre-400/15 dark:text-ochre-300">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="requirement" status={status} />
            <span className="text-xs text-subtle">{category.name}</span>
          </div>
          <h3 className="mt-1.5 font-sans text-base font-semibold">{r.title}</h3>
        </div>
        <Dropdown
          items={items}
          trigger={(props) => (
            <button
              {...props}
              type="button"
              aria-label={`Actions for ${r.title}`}
              className="-mt-1 -mr-1 inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg"
            >
              <Ellipsis className="size-5" />
            </button>
          )}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-subtle">Quantity</dt>
          <dd className="font-medium tabular-nums">{formatQuantity(r.quantity, r.unit)}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Budget / {unit}</dt>
          <dd className="font-medium tabular-nums">
            {r.budgetMin !== undefined ? `${formatCurrency(r.budgetMin)}–` : 'Up to '}
            {formatCurrency(r.budgetMax)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Location</dt>
          <dd className="flex items-center gap-1 font-medium">
            <MapPin className="size-3.5 text-subtle" aria-hidden="true" />
            {stateName(r.preferredLocation)} · ≤{r.maxDeliveryDistanceKm} km
          </dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Application</dt>
          <dd className="font-medium">{APPLICATIONS[r.intendedApplication]}</dd>
        </div>
      </dl>

      {r.qualityRequirements.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Quality requirements">
          {r.qualityRequirements.map((tag) => (
            <li key={tag} className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-muted">
              {QUALITY_TAGS[tag]}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {status === 'expired' ? 'Expired' : 'Expires'} {formatDate(r.expiresAt)}
        </span>
        {status === 'active' ? (
          <ButtonLink to={`${matchesPath}?requirement=${r.id}`} size="sm" variant="outline" leftIcon={<Sparkles className="size-4" />}>
            {matchCount === undefined
              ? 'View matches'
              : matchCount.total === 0
                ? 'No matches yet'
                : `${matchCount.total} match${matchCount.total === 1 ? '' : 'es'}${matchCount.full ? ` · ${matchCount.full} full` : ''}`}
          </ButtonLink>
        ) : (
          <span className="text-xs text-subtle">{status === 'paused' ? 'Matching paused' : status === 'expired' ? 'Not used for matching' : 'Fulfilled'}</span>
        )}
      </div>
      </div>
    </article>
  )
}
