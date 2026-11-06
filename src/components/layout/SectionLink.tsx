import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface SectionLinkProps {
  section: string
  className?: string
  children: ReactNode
  onNavigate?: () => void
  'aria-current'?: 'page' | 'location' | undefined
}

/** Links to a home-page section: smooth-scrolls when already on "/", otherwise navigates to "/#section". */
export function SectionLink({ section, className, children, onNavigate, ...rest }: SectionLinkProps) {
  const { pathname, search } = useLocation()

  if (pathname !== '/') {
    return (
      <Link to={{ pathname: '/', hash: section === 'top' ? '' : section }} className={className} onClick={onNavigate} {...rest}>
        {children}
      </Link>
    )
  }

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    onNavigate?.()
    if (section === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
    else document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Keep the URL shareable without adding a history entry per click.
    window.history.replaceState(window.history.state, '', section === 'top' ? `/${search}` : `/${search}#${section}`)
  }

  return (
    <a href={section === 'top' ? '/' : `#${section}`} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
