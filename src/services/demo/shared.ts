import type { ServiceResult } from '../types'

/** Simulated network latency so loading states are visible during demos. */
export function delay(ms = 600) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

/** Standard result for operations that need a backend that isn't connected yet. */
export function notConnected<T>(what: string): ServiceResult<T> {
  return {
    ok: false,
    error: {
      code: 'not_connected',
      message: `${what} isn’t available yet — the HeyCileng backend hasn’t been connected. Nothing was sent or saved.`,
    },
  }
}

export const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })

export const notFound = <T>(what: string): ServiceResult<T> => ({
  ok: false,
  error: { code: 'not_found', message: `${what} couldn’t be found.` },
})

export const invalid = <T>(message: string): ServiceResult<T> => ({ ok: false, error: { code: 'validation', message } })

/** Deep copy so callers can't mutate the demo store by accident. */
export const copy = <T>(value: T): T => structuredClone(value)

/**
 * Builds a service whose every method resolves to `not_connected`.
 * Used for data services when Demo Preview Mode is off and no backend exists.
 */
export function unconnectedService<T extends object>(what: string): T {
  return new Proxy({} as T, {
    get: () => async () => notConnected(what),
  })
}
