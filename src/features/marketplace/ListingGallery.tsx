import { useState } from 'react'
import { cn } from '@/lib/cn'
import type { Listing } from '@/types/listing'
import { ListingImage } from './ListingImage'

export function ListingGallery({ listing }: { listing: Listing }) {
  const [active, setActive] = useState(0)
  const images = listing.images.length ? listing.images : [{ id: 'placeholder', alt: listing.name }]

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border">
        <ListingImage image={images[active]} category={listing.category} variant={active} />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3" role="group" aria-label="Choose image">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className={cn(
                'aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                index === active ? 'border-action' : 'border-transparent opacity-75 hover:opacity-100',
              )}
            >
              <ListingImage image={image} category={listing.category} variant={index} showLabel={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
