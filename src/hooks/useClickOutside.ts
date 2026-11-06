import { useEffect, useRef, type RefObject } from 'react'

/** Calls `handler` on pointer down outside every element in `refs`. */
export function useClickOutside(refs: RefObject<HTMLElement | null>[], handler: () => void, active = true) {
  const handlerRef = useRef(handler)
  const refsRef = useRef(refs)
  useEffect(() => {
    handlerRef.current = handler
    refsRef.current = refs
  })

  useEffect(() => {
    if (!active) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (refsRef.current.every((ref) => !ref.current?.contains(target))) handlerRef.current()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [active])
}
