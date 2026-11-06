import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Marks content built from illustrative demo fixtures. Never remove this from demo-backed views. */
export function DemoBadge({ label = 'Illustrative demo data', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-dashed border-ochre-400/70 bg-ochre-50 px-2.5 py-0.5 text-xs font-medium text-ochre-800 dark:bg-ochre-400/10 dark:text-ochre-200',
        className,
      )}
      title="This content is sample data for demonstration. It does not represent real customers, transactions or partners."
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
