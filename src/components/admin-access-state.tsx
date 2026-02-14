import { Link } from '@tanstack/react-router'

type AdminAccessStateProps = {
  title: string
  description: string
  ctaLabel: string
  ctaTo: '/' | '/auth/sign-in' | '/admin/users' | '/admin/reports'
}

export function AdminAccessState({
  title,
  description,
  ctaLabel,
  ctaTo,
}: AdminAccessStateProps) {
  return (
    <div className='mx-auto flex min-h-[40vh] w-full max-w-lg flex-col items-center justify-center rounded-xl border bg-card p-6 text-center'>
      <h2 className='text-xl font-semibold'>{title}</h2>
      <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
      <Link
        to={ctaTo}
        className='mt-5 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90'
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
