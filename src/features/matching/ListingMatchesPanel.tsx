import { ChevronDown, CircleCheckBig, Sparkles, TriangleExclamationPoint } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { convertQuantity } from '@/lib/inventory'
import { services } from '@/services'
import type { Listing } from '@/types/listing'
import type { MatchResult } from '@/types/match'
import type { Requirement } from '@/types/requirement'
import { MatchBreakdown, MatchScore, MatchTypeBadge } from './MatchParts'

interface ListingMatchesPanelProps {
  listing: Listing
  matchesPath: string
  /** Opens the order request prefilled with a requirement's quantity (in the listing's unit). */
  onRequestForRequirement?: (quantity: number) => void
}

function MatchRow({ requirement, match, matchesPath, onRequest }: { requirement: Requirement; match: MatchResult; matchesPath: string; onRequest?: () => void }) {
  const [open, setOpen] = useState(false)
  const id = `lm-${requirement.id}`
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <MatchScore score={match.score} type={match.type} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{requirement.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <MatchTypeBadge type={match.type} />
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id} className="inline-flex items-center gap-1 text-xs font-semibold text-action">
              {open ? 'Hide details' : 'Why?'}
              <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div id={id} className="mt-4 animate-fade-in space-y-4">
          <MatchBreakdown criteria={match.criteria} />
          <ul className="space-y-1.5 text-sm text-muted">
            {match.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-leaf-600 dark:text-leaf-400" aria-hidden="true" />
                {r}
              </li>
            ))}
            {match.warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0 text-ochre-600 dark:text-ochre-300" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            {onRequest && (
              <button type="button" onClick={onRequest} className="text-action hover:underline">
                Request with this requirement’s quantity
              </button>
            )}
            <Link to={`${matchesPath}?requirement=${requirement.id}`} className="text-action hover:underline">
              Compare all matches
            </Link>
          </div>
        </div>
      )}
    </li>
  )
}

/** Buyer view: how a listing fits each active requirement. Advisory only. */
export function ListingMatchesPanel({ listing, matchesPath, onRequestForRequirement }: ListingMatchesPanelProps) {
  const { data, loading, error } = useAsync(() => services.matching.matchesForListing(listing.id), listing.id)

  if (loading) return <Skeleton className="h-28 w-full rounded-xl" />
  if (error || !data || data.length === 0) return null

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-action" aria-hidden="true" />
            Matches your requirements
          </span>
        }
        description="Advisory scores — they don’t place orders or reserve stock."
      />
      <CardBody>
        <ul className="divide-y divide-border">
          {data.map(({ requirement, match }) => (
            <MatchRow
              key={requirement.id}
              requirement={requirement}
              match={match}
              matchesPath={matchesPath}
              onRequest={
                onRequestForRequirement && listing.status === 'active'
                  ? () => onRequestForRequirement(Math.ceil(convertQuantity(requirement.quantity, requirement.unit, listing.unit)))
                  : undefined
              }
            />
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
