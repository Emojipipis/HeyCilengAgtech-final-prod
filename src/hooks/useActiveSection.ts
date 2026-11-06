import { useEffect, useState } from 'react'

/** Returns the id of the section currently nearest the top of the viewport. */
export function useActiveSection(ids: string[], enabled = true) {
  const [active, setActive] = useState<string>(ids[0] ?? '')
  const key = ids.join('|')

  useEffect(() => {
    if (!enabled) return
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top)
          else visible.delete(entry.target.id)
        })
        if (visible.size > 0) {
          // The visible section closest to the top wins.
          const [id] = [...visible.entries()].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]))[0]
          setActive(id)
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key, enabled])

  return active
}
