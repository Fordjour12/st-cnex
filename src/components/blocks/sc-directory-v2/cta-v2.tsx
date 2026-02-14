import { ArrowRight } from 'lucide-react'

import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

export function CtaV2() {
  const { ref, visible } = useInView<HTMLElement>({ threshold: 0.2 })

  return (
    <section ref={ref} className='cta-v2 relative overflow-hidden py-24 sm:py-36'>
      <div className='grain-overlay' />

      <div className='absolute inset-0 -z-10'>
        <div className='absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[120px]' />
      </div>

      <div className='absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />

      <div className='mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12'>
        <div className={cn('cta-content mx-auto max-w-3xl text-center', visible && 'visible')}>
          <div className='mb-8 flex items-center justify-center gap-4'>
            <span className='block h-px w-12 bg-primary' />
            <span className='text-[10px] font-bold tracking-[0.3em] text-primary uppercase sm:text-xs'>
              Join Us
            </span>
            <span className='block h-px w-12 bg-primary' />
          </div>

          <h2 className='mb-8 text-5xl leading-[0.85] font-black tracking-tighter text-foreground sm:text-6xl lg:text-8xl'>
            Ready to
            <br />
            <span className='cta-gradient'>Shape the Future</span>
            <span className='text-primary'>?</span>
          </h2>

          <p className='mx-auto mb-12 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg'>
            Join Africa&apos;s premier startup directory. Whether you&apos;re building the next big thing or
            looking to invest in it, your journey starts here.
          </p>

          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <a
              href='/register'
              className='cta-btn-primary group inline-flex items-center gap-3 bg-foreground px-10 py-5 text-sm font-bold tracking-wider text-background uppercase transition-all duration-300 hover:bg-primary hover:text-primary-foreground'
            >
              List Your Startup
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
            </a>
            <a
              href='/register'
              className='cta-btn-secondary group inline-flex items-center gap-3 border border-foreground/20 px-10 py-5 text-sm font-bold tracking-wider text-foreground uppercase transition-all duration-300 hover:border-foreground/40 hover:bg-foreground/5'
            >
              Join as Investor
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
            </a>
          </div>

          <div className='mt-16 flex items-center justify-center gap-6 text-muted-foreground/40'>
            <span className='text-[10px] tracking-widest uppercase'>Free to join</span>
            <span className='block h-1 w-1 rounded-full bg-current' />
            <span className='text-[10px] tracking-widest uppercase'>No credit card</span>
            <span className='block h-1 w-1 rounded-full bg-current' />
            <span className='text-[10px] tracking-widest uppercase'>Verified community</span>
          </div>
        </div>
      </div>
    </section>
  )
}
