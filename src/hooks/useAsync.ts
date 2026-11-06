import { useCallback, useEffect, useRef, useState } from 'react'
import type { ServiceError, ServiceResult } from '@/services'

export interface AsyncState<T> {
  /** Latest data. Kept while a newer request is in flight (stale-while-revalidate). */
  data: T | undefined
  error: ServiceError | undefined
  loading: boolean
  /** Re-run the request. */
  reload: () => void
  /** Replace data locally after a successful mutation. */
  setData: (updater: T | ((current: T | undefined) => T)) => void
}

interface Settled<T> {
  /** The request this result belongs to. */
  key: string
  data?: T
  error?: ServiceError
}

/**
 * Runs a service call and tracks loading / error / data. Re-runs when `key` changes.
 * Responses for superseded keys are ignored.
 */
export function useAsync<T>(load: () => Promise<ServiceResult<T>>, key: string): AsyncState<T> {
  const [token, setToken] = useState(0)
  const [settled, setSettled] = useState<Settled<T>>()
  const requestKey = `${key}#${token}`
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const ticket = { active: true }
    void loadRef.current().then((result) => {
      if (!ticket.active) return
      setSettled((previous) =>
        result.ok ? { key: requestKey, data: result.data } : { key: requestKey, data: previous?.data, error: result.error },
      )
    })
    return () => {
      ticket.active = false
    }
  }, [requestKey])

  const reload = useCallback(() => setToken((t) => t + 1), [])
  const setData = useCallback(
    (updater: T | ((current: T | undefined) => T)) =>
      setSettled((previous) => ({
        key: previous?.key ?? '',
        data: typeof updater === 'function' ? (updater as (c: T | undefined) => T)(previous?.data) : updater,
      })),
    [],
  )

  const current = settled?.key === requestKey
  return {
    data: settled?.data,
    error: current ? settled?.error : undefined,
    loading: !current,
    reload,
    setData,
  }
}
