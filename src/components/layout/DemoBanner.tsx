import { FlaskConical } from 'lucide-react'

/** Persistent notice on every dashboard page while Demo Preview Mode supplies the session. */
export function DemoBanner() {
  return (
    <div role="note" className="border-b border-dashed border-ochre-400/70 bg-ochre-50 text-ochre-900 dark:bg-ochre-400/10 dark:text-ochre-100">
      <div className="flex items-start gap-2.5 px-4 py-2 text-xs sm:items-center sm:px-6">
        <FlaskConical className="mt-px size-4 shrink-0 sm:mt-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Demo preview — not a real account.</span> All listings, orders and businesses shown are
          illustrative. Changes stay in this browser tab and are never sent to HeyCileng.
        </p>
      </div>
    </div>
  )
}
