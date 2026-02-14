import type { ErrorComponentProps } from '@tanstack/react-router'

export function RootErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <main className='grid min-h-dvh place-items-center p-6'>
      <section className='w-full max-w-md rounded-xl border bg-card p-6 shadow-sm'>
        <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          Error
        </p>
        <h1 className='mt-2 text-xl font-semibold text-foreground'>Something went wrong</h1>
        <p className='mt-2 text-sm text-muted-foreground'>{error.message}</p>
        <div className='mt-5 flex items-center gap-3'>
          <button
            type='button'
            onClick={() => reset()}
            className='inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90'
          >
            Try again
          </button>
          <a
            href='/'
            className='inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-accent'
          >
            Go home
          </a>
        </div>
      </section>
    </main>
  )
}
