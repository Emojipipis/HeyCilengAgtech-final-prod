import { createContext, type ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastInput {
  tone?: ToastTone
  title: ReactNode
  description?: ReactNode
  /** Milliseconds before auto-dismiss. 0 keeps it until closed. */
  duration?: number
}

export interface Toast extends Required<Pick<ToastInput, 'tone' | 'duration'>>, Omit<ToastInput, 'tone' | 'duration'> {
  id: number
}

export interface ToastContextValue {
  toast: (input: ToastInput) => number
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
