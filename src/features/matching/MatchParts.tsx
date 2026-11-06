import { CircleCheckBig, CircleQuestionMark, CircleMinus, Info, TriangleExclamationPoint } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { CRITERION_LABELS, MATCH_WEIGHTS } from '@/config/matching'
import { cn } from '@/lib/cn'
import type { CriterionScore, MatchType } from '@/types/match'

/** Circular advisory score. */
export function MatchScore({ score, type, size = 'md' }: { score: number; type: MatchType; size?: 'sm' | 'md' }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const dimension = size === 'sm' ? 'size-14' : 'size-18'
  return (
    <div className={cn('relative shrink-0', dimension)} role="img" aria-label={`Match score ${score} out of 100`}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} strokeWidth="6" fill="none" className="stroke-surface-sunken" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={type === 'full' ? 'stroke-action' : 'stroke-ochre-400'}
        />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center font-display font-bold tabular-nums', size === 'sm' ? 'text-base' : 'text-xl')}>
        {score}
      </span>
    </div>
  )
}

export function MatchTypeBadge({ type }: { type: MatchType }) {
  if (type === 'full')
    return (
      <Badge tone="success" dot>
        Full match
      </Badge>
    )
  if (type === 'partial')
    return (
      <Badge tone="warning" dot>
        Partial match
      </Badge>
    )
  return (
    <Badge tone="neutral" dot>
      Not eligible
    </Badge>
  )
}

const statusIcon = {
  good: { Icon: CircleCheckBig, className: 'text-leaf-600 dark:text-leaf-400', bar: 'bg-action', label: 'Meets requirement' },
  partial: { Icon: CircleMinus, className: 'text-ochre-600 dark:text-ochre-300', bar: 'bg-ochre-400', label: 'Partly meets requirement' },
  poor: { Icon: TriangleExclamationPoint, className: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', label: 'Doesn’t meet requirement' },
  unknown: { Icon: CircleQuestionMark, className: 'text-subtle', bar: 'bg-border-strong', label: 'Not enough information' },
}

/** Per-criterion breakdown with weights. */
export function MatchBreakdown({ criteria }: { criteria: CriterionScore[] }) {
  return (
    <ul className="space-y-3">
      {criteria.map((c) => {
        const meta = statusIcon[c.status]
        return (
          <li key={c.criterion}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <meta.Icon className={cn('size-4 shrink-0', meta.className)} aria-hidden="true" />
                <span className="font-medium text-fg">{CRITERION_LABELS[c.criterion]}</span>
                <span className="sr-only">— {meta.label}</span>
              </span>
              <span className="shrink-0 text-xs text-subtle tabular-nums">
                {Math.round(c.score * c.weight * 100)} / {Math.round(c.weight * 100)} pts
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
              <div className={cn('h-full rounded-full', meta.bar)} style={{ width: `${Math.round(c.score * 100)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{c.detail}</p>
          </li>
        )
      })}
    </ul>
  )
}

export function MatchDisclaimer({ className }: { className?: string }) {
  return (
    <Alert tone="info" title="Matches are recommendations, not guarantees" className={className}>
      Scores compare your requirement with each listing’s details. Matching never places an order, reserves stock or contacts the
      seller — you decide whether to request an order.
    </Alert>
  )
}

export function MatchLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
      <span className="inline-flex items-center gap-1.5">
        <Info className="size-3.5" aria-hidden="true" />
        Weights: {(Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).map((k) => `${k} ${Math.round(MATCH_WEIGHTS[k] * 100)}`).join(' · ')}
      </span>
    </p>
  )
}
