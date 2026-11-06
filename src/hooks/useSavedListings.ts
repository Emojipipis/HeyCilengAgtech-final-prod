import { useCallback, useEffect, useState } from 'react'
import { services } from '@/services'
import { useToast } from './useToast'

/** Saved-listing ids with optimistic toggling. */
export function useSavedListings() {
  const { toast } = useToast()
  const [saved, setSaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    void services.marketplace.savedIds().then((result) => {
      if (!cancelled && result.ok) setSaved(new Set(result.data))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback(
    async (listingId: string) => {
      const next = !saved.has(listingId)
      const apply = (value: boolean) =>
        setSaved((current) => {
          const copy = new Set(current)
          if (value) copy.add(listingId)
          else copy.delete(listingId)
          return copy
        })
      apply(next)
      const result = await services.marketplace.setSaved(listingId, next)
      if (!result.ok) {
        apply(!next)
        toast({ tone: 'error', title: 'Couldn’t update saved listings', description: result.error.message })
        return false
      }
      toast({ tone: 'success', title: next ? 'Listing saved' : 'Removed from saved listings', duration: 2500 })
      return true
    },
    [saved, toast],
  )

  return { saved, isSaved: (id: string) => saved.has(id), toggle }
}
