import { ArrowLeft, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Logo className="mb-10" />
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-accent-soft text-ochre-600 dark:text-ochre-300">
        <Sprout className="size-8" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-widest text-subtle">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">This field is empty</h1>
      <p className="mt-3 max-w-md text-muted">
        The page you are looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-fg transition-colors hover:bg-primary-hover"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to home
      </Link>
    </main>
  )
}
