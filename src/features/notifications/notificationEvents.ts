import { useEffect, useRef } from 'react'

const EVENT = 'heycileng:notifications-changed'

/** Tell other notification views (e.g. the bell) that read state changed. */
export function announceNotificationsChanged() {
  window.dispatchEvent(new Event(EVENT))
}

export function useNotificationsChanged(handler: () => void) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    const listener = () => ref.current()
    window.addEventListener(EVENT, listener)
    return () => window.removeEventListener(EVENT, listener)
  }, [])
}
