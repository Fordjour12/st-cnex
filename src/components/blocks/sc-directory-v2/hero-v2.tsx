import { useEffect, useState } from 'react'
import { ArrowRight, Rocket, Search } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface HeroV2Props {
  isAuthenticated: boolean
}

export function HeroV2({ isAuthenticated }: HeroV2Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)

  useEffect(() => {
    setMounted(true)

    const handleMouseMove = (event: MouseEvent): void => {
      setMouseX((event.clientX / window.innerWidth - 0.5) * 20)
      setMouseY((event.clientY / window.innerHeight - 0.5) * 20)
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <section className='hero-v2 relative min-h-screen overflow-hidden' role='banner'>
      <div className='grain-overlay' />

      <div
        className='geo-shapes'
        style={{
          transform: `translate(${mouseX * 0.3}px, ${mouseY * 0.3}px)`,
        }}
      >
        <div className='geo geo-1' />
        <div className='geo geo-2' />
        <div className='geo geo-3' />
        <div className='geo geo-4' />
        <div className='geo geo-5' />
      </div>

      <div
        className='spotlight'
        style={{
          background: `radial-gradient(ellipse 800px 600px at calc(50% + ${mouseX * 2}px) calc(40% + ${mouseY * 2}px), oklch(0.4709 0.0711 155.8818 / 0.08), transparent 70%)`,
        }}
      />

      <div className={cn('accent-line', mounted && 'mounted')} />

      <div className='relative z-10 mx-auto max-w-[1400px] px-6 pt-24 pb-16 sm:px-8 sm:pt-32 sm:pb-24 lg:px-12 lg:pt-40 lg:pb-32'>
        <div className='grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-4'>
          <div className='lg:col-span-7 xl:col-span-7'>
            <div className={cn('hero-label mb-8', mounted && 'mounted')}>
              <span className='label-line' />
              <span className='text-[10px] font-bold tracking-[0.3em] text-primary uppercase sm:text-xs'>
                Ghana&apos;s Innovation Directory
              </span>
              <span className='label-dot' />
            </div>

            <h1 className={cn('hero-title', mounted && 'mounted')}>
              <span className='title-line title-line-1'>
                <span className='font-light text-muted-foreground/60'>Where</span>
              </span>
              <span className='title-line title-line-2'>
                <span className='hero-heavy'>Africa&apos;s</span>
              </span>
              <span className='title-line title-line-3'>
                <span className='hero-gradient'>Innovation</span>
              </span>
              <span className='title-line title-line-4'>
                <span className='font-light text-muted-foreground/60'>Meets</span>
                <span className='hero-heavy hero-accent'>Capital</span>
              </span>
            </h1>
          </div>

          <div className='lg:col-span-5 lg:pl-8 xl:col-span-5'>
            <p className={cn('hero-subtitle mb-8', mounted && 'mounted')}>
              Discover innovative startups, connect with visionary founders, and invest in the future of
              African tech, all in one curated marketplace.
            </p>

            <div className={cn('hero-search mb-8', mounted && 'mounted')}>
              <div className='search-wrap'>
                <Search className='absolute top-1/2 left-5 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground/50' />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  type='text'
                  placeholder='Search startups, sectors...'
                  className='search-input w-full border-0 bg-transparent py-5 pr-5 pl-14 text-base text-foreground placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none'
                />
              </div>
            </div>

            <div className={cn('hero-cta flex flex-col gap-3 sm:flex-row', mounted && 'mounted')}>
              {!isAuthenticated ? (
                <>
                  <a
                    href='/register'
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'cta-primary gap-2 rounded-none px-8 py-6 text-sm font-bold tracking-wider uppercase',
                    )}
                  >
                    Get Started
                    <ArrowRight className='h-4 w-4' />
                  </a>
                  <a
                    href='/startup-directory'
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'cta-secondary gap-2 rounded-none border-foreground/20 px-8 py-6 text-sm font-bold tracking-wider uppercase hover:bg-foreground/5',
                    )}
                  >
                    Browse Directory
                  </a>
                </>
              ) : (
                <>
                  <a
                    href='/startup-directory/submit'
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'cta-primary gap-2 rounded-none px-8 py-6 text-sm font-bold tracking-wider uppercase',
                    )}
                  >
                    <Rocket className='h-4 w-4' />
                    List Your Startup
                  </a>
                  <a
                    href='/startup-directory'
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'lg' }),
                      'cta-secondary gap-2 rounded-none border-foreground/20 px-8 py-6 text-sm font-bold tracking-wider uppercase hover:bg-foreground/5',
                    )}
                  >
                    Explore Directory
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={cn('hero-ticker mt-20 lg:mt-28', mounted && 'mounted')}>
          <div className='ticker-line' />
          <div className='flex flex-wrap gap-10 pt-8 sm:gap-16'>
            <div className='ticker-item'>
              <span className='ticker-number'>500+</span>
              <span className='ticker-label'>Startups</span>
            </div>
            <div className='ticker-item'>
              <span className='ticker-number'>$50M+</span>
              <span className='ticker-label'>Capital Raised</span>
            </div>
            <div className='ticker-item'>
              <span className='ticker-number'>200+</span>
              <span className='ticker-label'>Investors</span>
            </div>
            <div className='ticker-item'>
              <span className='ticker-number'>8</span>
              <span className='ticker-label'>Sectors</span>
            </div>
          </div>
        </div>
      </div>

      <div className={cn('scroll-indicator', mounted && 'mounted')}>
        <div className='scroll-line' />
        <span className='scroll-text'>Scroll</span>
      </div>
    </section>
  )
}
