import { Search, X } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible label (visually hidden). */
  label?: string
  className?: string
  size?: 'sm' | 'md'
}

export function SearchBar({ value, onChange, placeholder = 'Search…', label = 'Search', className, size = 'md' }: SearchBarProps) {
  const id = useId()
  return (
    <div role="search" className={cn('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-border-strong bg-surface pr-10 pl-10 text-sm text-fg placeholder:text-subtle transition-[border-color,box-shadow]',
          'hover:border-subtle focus:border-action focus:ring-3 focus:ring-action/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
          size === 'sm' ? 'h-9' : 'h-11',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
