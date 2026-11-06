import { CreditCard } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button, type ButtonProps } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/format'
import { amountDue } from '@/lib/payments'
import { services, type ServiceError } from '@/services'
import type { Order } from '@/types/order'

/**
 * Starts Paystack checkout for a payable order and sends the buyer to Paystack's secure page.
 * The amount is fixed by the backend; the label shows the same figure for reference.
 */
export function CheckoutButton({ order, size = 'lg', fullWidth = true, label }: { order: Order; size?: ButtonProps['size']; fullWidth?: boolean; label?: string }) {
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  const pay = async () => {
    setStarting(true)
    setError(null)
    const r = await services.payments.startCheckout(order.id)
    if (r.ok) {
      window.location.assign(r.data.authorizationUrl)
      return
    }
    setStarting(false)
    setError(r.error)
  }

  return (
    <div className="space-y-2">
      <Button fullWidth={fullWidth} size={size} loading={starting} leftIcon={<CreditCard className="size-4" />} onClick={() => void pay()}>
        {starting ? 'Opening Paystack…' : (label ?? `Pay ${formatCurrency(amountDue(order))} with Paystack`)}
      </Button>
      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}
    </div>
  )
}
