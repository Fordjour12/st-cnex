import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

interface DirectoryItem {
  id: string
  name: string
  sector: string
  location: string
  description: string
  image: string
  type: 'startup' | 'investor'
  stage: string
  metric: string
  size: 'lg' | 'md' | 'sm'
}

const directory: Array<DirectoryItem> = [
  {
    id: '1',
    name: 'PayFlow',
    sector: 'Fintech',
    location: 'Accra, Ghana',
    description:
      'Digital payment solutions revolutionizing how African SMEs handle transactions across borders.',
    image: '/gm-g-img-2.png',
    type: 'startup',
    stage: 'Series A',
    metric: '$2.5M raised',
    size: 'lg',
  },
  {
    id: '2',
    name: 'GreenHarvest',
    sector: 'AgriTech',
    location: 'Kumasi, Ghana',
    description: 'IoT-powered farm management increasing yields by 300% across West Africa.',
    image: '/gm-g-img-2-a.png',
    type: 'startup',
    stage: 'Seed',
    metric: '10K farmers',
    size: 'md',
  },
  {
    id: '3',
    name: 'HealthLink',
    sector: 'HealthTech',
    location: 'Tema, Ghana',
    description: 'Telemedicine connecting 1M+ patients to certified healthcare professionals.',
    image: '/gm-g-img-1.png',
    type: 'startup',
    stage: 'Series B',
    metric: '1M+ patients',
    size: 'sm',
  },
  {
    id: '4',
    name: 'Stellar Ventures',
    sector: 'Venture Capital',
    location: 'Accra, Ghana',
    description: 'Early-stage tech investment fund with $25M AUM backing African innovation.',
    image: '/gm-g-img-2.png',
    type: 'investor',
    stage: '$25M AUM',
    metric: '30+ portfolio',
    size: 'md',
  },
  {
    id: '5',
    name: 'EduTech Hub',
    sector: 'EdTech',
    location: 'Accra, Ghana',
    description: 'Online learning platform empowering 500K+ African youth with future-ready skills.',
    image: '/gm-g-img-2-a.png',
    type: 'startup',
    stage: 'Pre-Seed',
    metric: '500K learners',
    size: 'sm',
  },
  {
    id: '6',
    name: 'Lagos Tech Angels',
    sector: 'Angel Network',
    location: 'Lagos, Nigeria',
    description: 'Community of 50+ angels investing in next-gen West African tech companies.',
    image: '/gm-g-img-1.png',
    type: 'investor',
    stage: 'Angel',
    metric: '50+ angels',
    size: 'lg',
  },
]

export function DirectoryV2() {
  const { ref, visible } = useInView<HTMLElement>({ threshold: 0.1 })

  return (
    <section ref={ref} id='featured-directory' className='directory-v2 relative overflow-hidden py-24 sm:py-32'>
      <div className='grain-overlay' />

      <div className='absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />

      <div className='mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12'>
        <div className={cn('section-intro', visible && 'visible')}>
          <div className='mb-6 flex items-center gap-4'>
            <span className='block h-px w-12 bg-primary' />
            <span className='text-[10px] font-bold tracking-[0.3em] text-primary uppercase sm:text-xs'>
              Featured
            </span>
          </div>

          <div className='mb-16 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end'>
            <h2 className='text-4xl leading-[0.9] font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
              Discover the
              <br />
              Next Big Thing
            </h2>
            <a
              href='/startup-directory'
              className='group inline-flex items-center gap-3 text-sm font-bold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground'
            >
              View All
              <span className='block h-px w-8 bg-current transition-all duration-300 group-hover:w-12' />
            </a>
          </div>
        </div>

        <div className='bento-grid'>
          {directory.map((item, index) => (
            <a
              key={item.id}
              href={`/startup-directory/${item.id}`}
              className={cn(
                `bento-item bento-${item.size} group relative overflow-hidden`,
                visible && 'visible',
              )}
              style={{ transitionDelay: `${index * 0.08}s` }}
            >
              <div className='absolute inset-0'>
                <img
                  src={item.image}
                  alt={item.name}
                  className='h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/95 group-hover:via-black/50' />
              </div>

              <div className='relative flex h-full flex-col justify-end p-6 sm:p-8'>
                <div className='absolute top-5 left-6 sm:top-7 sm:left-8'>
                  <span className='inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase'>
                    <span
                      className={cn(
                        'block h-2 w-2 rounded-full',
                        item.type === 'startup' ? 'bg-emerald-400' : 'bg-violet-400',
                      )}
                    />
                    {item.type}
                  </span>
                </div>

                <div className='absolute top-5 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:top-7 sm:right-8'>
                  <span className='bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur-sm'>
                    {item.metric}
                  </span>
                </div>

                <div>
                  <div className='mb-3 flex gap-2'>
                    <span className='text-[10px] font-bold tracking-wider text-white/50 uppercase'>
                      {item.sector}
                    </span>
                    <span className='text-white/20'>·</span>
                    <span className='text-[10px] tracking-wider text-white/40 uppercase'>
                      {item.location}
                    </span>
                  </div>

                  <h3 className='mb-2 text-xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-primary sm:text-2xl'>
                    {item.name}
                  </h3>

                  <p className='max-h-0 overflow-hidden text-sm leading-relaxed text-white/50 transition-all duration-500 ease-out group-hover:max-h-20'>
                    {item.description}
                  </p>

                  <div
                    className='mt-4 flex translate-y-2 transform items-center gap-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'
                    style={{ transitionDelay: '0.1s' }}
                  >
                    <span className='text-xs font-bold tracking-wider text-primary uppercase'>
                      {item.stage}
                    </span>
                    <span className='block h-px flex-1 bg-white/10' />
                    <svg
                      className='h-4 w-4 text-white/40 transition-transform group-hover:translate-x-1'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
