import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface LogoProps {
  to?: string
  className?: string
  /** Hide the wordmark and show only the mark. */
  compact?: boolean
}

/**
 * Where the mark sits:
 * - `auto`: regular surfaces — brand colours in light mode, lightened in dark mode.
 * - `onDark`: always-dark backgrounds such as the footer.
 * - `tile`: the original emblem on a white rounded tile, readable on any background.
 */
export type LogoMarkTone = 'auto' | 'onDark' | 'tile'

const STROKES: Record<Exclude<LogoMarkTone, 'tile'>, { arrows: string; sprout: string }> = {
  auto: { arrows: 'stroke-[#3B403D] dark:stroke-[#D5DCD7]', sprout: 'stroke-[#2E9E4F] dark:stroke-leaf-400' },
  onDark: { arrows: 'stroke-[#D5DCD7]', sprout: 'stroke-leaf-400' },
}

/** Emblem paths in the original 400 × 400 artwork coordinates. */
function EmblemPaths({ arrows, sprout }: { arrows: string; sprout: string }) {
  return (
    <>
      <g className={arrows}>
        <path d="M84.1 168.9 A120 120 0 0 1 315.9 168.9" />
        <path d="M323.4 148.2 L315.9 168.9 L299 154.8" />
        <path d="M315.9 231.1 A120 120 0 0 1 84.1 231.1" />
        <path d="M76.6 251.8 L84.1 231.1 L101 245.2" />
      </g>
      <g className={sprout}>
        <path d="M200 272 V205" />
        <path d="M200 238 C168 238 150 218 148 192 C178 192 198 210 200 238 Z" />
        <path d="M200 212 C200 180 220 158 252 152 C254 184 236 210 200 212 Z" />
      </g>
    </>
  )
}

/** HeyCileng emblem: a sprout inside two circular arrows. */
export function LogoMark({ className, tone = 'auto' }: { className?: string; tone?: LogoMarkTone }) {
  const svgProps = {
    'aria-hidden': true,
    fill: 'none',
    strokeWidth: 9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('size-9 shrink-0', className),
  }

  if (tone === 'tile') {
    return (
      <svg viewBox="0 0 400 400" {...svgProps}>
        <rect width="400" height="400" rx="88" fill="#FFFFFF" stroke="none" />
        <EmblemPaths arrows="stroke-[#3B403D]" sprout="stroke-[#2E9E4F]" />
      </svg>
    )
  }

  // Cropped to the drawing (arcs span 80–320) so the emblem fills its box beside the wordmark.
  return (
    <svg viewBox="66 66 268 268" {...svgProps}>
      <EmblemPaths {...STROKES[tone]} />
    </svg>
  )
}

export function Logo({ to = '/', className, compact = false }: LogoProps) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="HeyCileng Agtech home">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-fg">HeyCileng</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ochre-600 dark:text-ochre-300">
            Agtech
          </span>
        </span>
      )}
    </Link>
  )
}
