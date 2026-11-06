import { Star, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FileDropzone } from '@/components/ui/FileDropzone'
import { cn } from '@/lib/cn'
import type { CategoryId } from '@/types/catalog'
import type { ListingImageInput } from '@/types/listing'
import { ListingImage } from '../marketplace/ListingImage'

const DEFAULT_MAX_IMAGES = 6
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

interface ListingImagesFieldProps {
  value: ListingImageInput[]
  onChange: (images: ListingImageInput[]) => void
  category: CategoryId | ''
  error?: string
  /** From platform settings. */
  maxImages?: number
}

/** Multiple product images: add, preview, choose a cover (first image) and remove. */
export function ListingImagesField({ value, onChange, category, error, maxImages = DEFAULT_MAX_IMAGES }: ListingImagesFieldProps) {
  const MAX_IMAGES = maxImages
  const [problem, setProblem] = useState<string>()
  // Preview URLs for newly chosen files (by image id). Created when files are added, revoked on removal/unmount.
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const previewsRef = useRef(previews)
  useEffect(() => {
    previewsRef.current = previews
  })
  useEffect(() => () => Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  const previewFor = (image: ListingImageInput) => image.url ?? previews[image.id]

  const add = (files: File[]) => {
    const rejected: string[] = []
    const accepted = files.filter((file) => {
      if (!ACCEPTED.includes(file.type)) rejected.push(`${file.name} isn’t a JPG, PNG or WebP image`)
      else if (file.size > MAX_BYTES) rejected.push(`${file.name} is larger than 5 MB`)
      else return true
      return false
    })
    const room = MAX_IMAGES - value.length
    if (accepted.length > room) rejected.push(`Only ${MAX_IMAGES} images are allowed`)
    setProblem(rejected.length ? `${rejected.join('. ')}.` : undefined)
    const next = accepted.slice(0, Math.max(0, room)).map((file) => ({
      id: `img-${crypto.randomUUID()}`,
      file,
      alt: file.name.replace(/\.[^.]+$/, ''),
    }))
    if (next.length) {
      setPreviews((current) => ({ ...current, ...Object.fromEntries(next.map((image) => [image.id, URL.createObjectURL(image.file)])) }))
      onChange([...value, ...next])
    }
  }

  const remove = (id: string) => {
    const url = previews[id]
    if (url) {
      URL.revokeObjectURL(url)
      setPreviews(({ [id]: _removed, ...rest }) => rest)
    }
    onChange(value.filter((image) => image.id !== id))
  }

  const makeCover = (id: string) => {
    const image = value.find((i) => i.id === id)
    if (image) onChange([image, ...value.filter((i) => i.id !== id)])
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((image, index) => {
            const src = previewFor(image)
            return (
              <li key={image.id} className={cn('group relative aspect-[4/3] overflow-hidden rounded-lg border-2', index === 0 ? 'border-action' : 'border-border')}>
                {src ? (
                  <img src={src} alt={image.alt} className="size-full object-cover" />
                ) : (
                  <ListingImage image={image} category={category || 'peels_pulp'} variant={index} />
                )}
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-full bg-action px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase dark:text-forest-950">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(image.id)}
                      aria-label={`Make image ${index + 1} the cover`}
                      className="inline-flex size-8 items-center justify-center rounded-full bg-surface/90 text-fg shadow-card hover:bg-surface"
                    >
                      <Star className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(image.id)}
                    aria-label={`Remove image ${index + 1}`}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-surface/90 text-red-600 shadow-card hover:bg-surface dark:text-red-400"
                  >
                    <Trash className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {value.length < MAX_IMAGES && (
        <FileDropzone
          accept={ACCEPTED.join(',')}
          onFiles={add}
          label={value.length ? 'Add more images' : 'Upload product images'}
          hint={`JPG, PNG or WebP · up to 5 MB each · ${value.length}/${MAX_IMAGES} added`}
          error={problem ?? error}
        />
      )}
      <p className="text-xs text-subtle">The first image is the cover shown in the marketplace. Show the material clearly, including packaging.</p>
    </div>
  )
}
