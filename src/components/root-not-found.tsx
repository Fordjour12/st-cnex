export function RootNotFound() {
  return (
    <main className='grid min-h-dvh place-items-center p-6'>
      <section className='w-full max-w-md rounded-xl border bg-card p-6 shadow-sm'>
        <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          404
        </p>
        <h1 className='mt-2 text-xl font-semibold text-foreground'>Page not found</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          The page you requested does not exist or may have been moved.
        </p>
        <a
          href='/'
          className='mt-5 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90'
        >
          Back to home
        </a>
      </section>
    </main>
  )
}
