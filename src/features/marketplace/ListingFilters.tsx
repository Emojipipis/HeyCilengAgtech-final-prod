import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { CATEGORIES } from '@/config/catalog'
import { STATES } from '@/config/locations'
import { PLATFORM } from '@/config/platform'
import type { ReactNode } from 'react'
import { activeFilterCount, EMPTY_FILTERS, type FilterState } from './filterState'

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-border pb-5 last:border-0 last:pb-0">
      <legend className="mb-3 text-sm font-semibold text-fg">{title}</legend>
      {children}
    </fieldset>
  )
}

export function ListingFilters({ value, onChange }: { value: FilterState; onChange: (value: FilterState) => void }) {
  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) => onChange({ ...value, [key]: next })
  const numeric = (raw: string) => raw.replace(/[^\d.]/g, '')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-base font-semibold">Filters</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange(EMPTY_FILTERS)}
          disabled={activeFilterCount(value) === 0}
          leftIcon={<RotateCcw className="size-3.5" />}
        >
          Reset
        </Button>
      </div>

      <FilterGroup title="Category">
        <div className="space-y-2.5">
          {CATEGORIES.map((category) => (
            <Checkbox
              key={category.id}
              label={category.name}
              checked={value.categories.includes(category.id)}
              onChange={() => set('categories', toggle(value.categories, category.id))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Location">
        <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
          {STATES.map((state) => (
            <Checkbox
              key={state.id}
              label={state.name}
              checked={value.states.includes(state.id)}
              onChange={() => set('states', toggle(value.states, state.id))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={`Price per kg (${PLATFORM.currency})`}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Min" inputMode="numeric" placeholder="0" value={value.minPrice} onChange={(e) => set('minPrice', numeric(e.target.value))} />
          <Input label="Max" inputMode="numeric" placeholder="Any" value={value.maxPrice} onChange={(e) => set('maxPrice', numeric(e.target.value))} />
        </div>
        <p className="mt-2 text-xs text-subtle">Prices in tonnes or 50 kg bags are converted to a per-kg equivalent.</p>
      </FilterGroup>

      <FilterGroup title="Quantity">
        <Input
          label="Minimum available (kg)"
          inputMode="decimal"
          placeholder="Any"
          value={value.minQuantity}
          onChange={(e) => set('minQuantity', numeric(e.target.value))}
        />
      </FilterGroup>
    </div>
  )
}
