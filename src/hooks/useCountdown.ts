import { useCallback, useEffect, useState } from 'react'

/** Seconds-remaining countdown, e.g. for OTP resend cooldowns. */
export function useCountdown(initialSeconds = 0) {
  const [endsAt, setEndsAt] = useState<number | null>(() => (initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : null))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= endsAt) {
        setEndsAt(null)
        window.clearInterval(timer)
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [endsAt])

  const start = useCallback((seconds: number) => {
    const current = Date.now()
    setNow(current)
    setEndsAt(current + seconds * 1000)
  }, [])

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))
  return { remaining, running: remaining > 0, start }
}
