import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const points = [
  'HeyCileng connects buyers and sellers of agricultural by-products and earns a commission on completed orders.',
  'Buyers and sellers do not contact each other directly. Order communication happens through platform notifications and HeyCileng support.',
  'Your phone number and email address are never shown to other marketplace users.',
  'Listings must describe materials accurately, including quantity, quality and location. HeyCileng may review, reject or suspend listings.',
  'Match scores are recommendations only. They do not place orders, reserve stock or guarantee suitability.',
  'An order request does not reserve stock until the seller accepts it.',
  'Logistics partners are assigned by HeyCileng. Delivery fees and who pays them are shown on each order.',
]

export function TermsDialog({ open, onClose, onAccept }: { open: boolean; onClose: () => void; onAccept: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Terms and conditions — summary"
      description="A plain-language summary of the key rules. The full legal terms will be published before public launch."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onAccept()
              onClose()
            }}
          >
            I accept
          </Button>
        </>
      }
    >
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted marker:font-semibold marker:text-fg">
        {points.map((point) => (
          <li key={point} className="pl-1">
            {point}
          </li>
        ))}
      </ol>
    </Modal>
  )
}
