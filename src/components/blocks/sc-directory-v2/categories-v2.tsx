import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

interface Sector {
  id: string
  label: string
  icon: string
  count: number
  accent: string
}

const sectors: Array<Sector> = [
  { id: 'fintech', label: 'Fintech', icon: '◆', count: 120, accent: 'oklch(0.65 0.18 155)' },
  { id: 'agritech', label: 'AgriTech', icon: '◇', count: 85, accent: 'oklch(0.60 0.15 130)' },
  { id: 'health', label: 'HealthTech', icon: '○', count: 65, accent: 'oklch(0.55 0.12 220)' },
  { id: 'education', label: 'EdTech', icon: '□', count: 90, accent: 'oklch(0.60 0.13 55)' },
  { id: 'ecommerce', label: 'E-Commerce', icon: '△', count: 75, accent: 'oklch(0.55 0.15 350)' },
  { id: 'logistics', label: 'Logistics', icon: '▽', count: 45, accent: 'oklch(0.55 0.12 275)' },
  { id: 'creative', label: 'Creative', icon: '◎', count: 55, accent: 'oklch(0.60 0.18 330)' },
  { id: 'ai', label: 'AI & ML', icon: '⬡', count: 110, accent: 'oklch(0.55 0.14 190)' },
]

export function CategoriesV2() {
  const { ref, visible } = useInView<HTMLElement>({ threshold: 0.15 })

  return (
    <section ref={ref} className='categories-v2 relative overflow-hidden py-24 sm:py-32'>
      <div className='grain-overlay' />

      <div className='mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12'>
        <div className={cn('section-intro', visible && 'visible')}>
          <div className='mb-6 flex items-center gap-4'>
            <span className='block h-px w-12 bg-secondary' />
            <span className='text-[10px] font-bold tracking-[0.3em] text-secondary uppercase sm:text-xs'>
              Sectors
            </span>
          </div>
          <div className='mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <h2 className='text-4xl leading-[0.9] font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
              Explore
              <br />
              by Industry
            </h2>
            <div className='flex items-end'>
              <p className='max-w-md text-base leading-relaxed text-muted-foreground'>
                Navigate Africa&apos;s tech ecosystem across eight core sectors. Each one a universe of
                innovation waiting to be discovered.
              </p>
            </div>
          </div>
        </div>

        <div className='sectors-grid grid grid-cols-2 gap-px bg-border/30 sm:grid-cols-4'>
          {sectors.map((sector, index) => (
            <a
              key={sector.id}
              href={`/startup-directory?category=${sector.id}`}
              className={cn(
                'sector-card group relative bg-background p-8 transition-all duration-500 sm:p-10',
                visible && 'visible',
              )}
              style={{
                ['--accent' as string]: sector.accent,
                transitionDelay: `${index * 0.06}s`,
              }}
            >
              <div className='absolute inset-0 bg-[var(--accent)] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.04]' />

              <div className='absolute top-0 right-0 left-0 h-[2px] origin-left scale-x-0 transform bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100' />

              <div className='relative'>
                <span className='mb-6 block text-2xl font-light text-muted-foreground/40 transition-colors duration-300 group-hover:text-[var(--accent)]'>
                  {sector.icon}
                </span>

                <h3 className='mb-1 text-sm font-bold tracking-tight text-foreground sm:text-base'>
                  {sector.label}
                </h3>

                <span className='text-xs tracking-wider text-muted-foreground/60 uppercase'>
                  {sector.count} companies
                </span>

                <div className='mt-6 flex translate-x-[-8px] transform items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100'>
                  <span className='block h-px w-6 bg-[var(--accent)]' />
                  <svg
                    className='h-3 w-3 text-[var(--accent)]'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
