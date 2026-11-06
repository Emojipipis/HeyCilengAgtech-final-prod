import { useEffect } from 'react'

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

/** Locks body scrolling while `active` is true. Nested locks are reference-counted. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { body, documentElement } = document

    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth
      previousOverflow = body.style.overflow
      previousPaddingRight = body.style.paddingRight
      body.style.overflow = 'hidden'
      // Compensate for the disappearing scrollbar so the layout doesn't shift.
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        body.style.overflow = previousOverflow
        body.style.paddingRight = previousPaddingRight
      }
    }
  }, [active])
}
