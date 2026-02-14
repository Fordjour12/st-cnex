import { useEffect, useMemo, useState } from 'react'

import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

interface Counters {
  startups: number
  raised: number
  investors: number
  connections: number
}

const targets: Counters = {
  startups: 500,
  raised: 50,
  investors: 200,
  connections: 10000,
}

interface Stat {
  key: keyof Counters
  label: string
  prefix?: string
  suffix?: string
}

const stats: Array<Stat> = [
  { key: 'startups', suffix: '+', label: 'Startups Listed' },
  { key: 'raised', prefix: '$', suffix: 'M+', label: 'Capital Raised' },
  { key: 'investors', suffix: '+', label: 'Active Investors' },
  { key: 'connections', suffix: '+', label: 'Connections' },
]

export function StatsV2() {
  const { ref, visible } = useInView<HTMLElement>({ threshold: 0.3 })
  const [counters, setCounters] = useState<Counters>({
    startups: 0,
    raised: 0,
    investors: 0,
    connections: 0,
  })

  useEffect(() => {
    if (!visible) {
      return
    }

    const timers: Array<number> = []

    const animateCounter = (
      key: keyof Counters,
      target: number,
      duration: number = 2000,
    ): void => {
      const startTime = performance.now()

      const step = (now: number): void => {
        const progress = Math.min((now - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        setCounters((prev) => ({
          ...prev,
          [key]: Math.round(target * eased),
        }))

        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }

      requestAnimationFrame(step)
    }

    timers.push(window.setTimeout(() => animateCounter('startups', targets.startups), 0))
    timers.push(window.setTimeout(() => animateCounter('raised', targets.raised, 1500), 200))
    timers.push(window.setTimeout(() => animateCounter('investors', targets.investors, 1800), 400))
    timers.push(window.setTimeout(() => animateCounter('connections', targets.connections, 2200), 600))

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer)
      })
    }
  }, [visible])

  const displayStats = useMemo(
    () =>
      stats.map((stat) => ({
        ...stat,
        value: counters[stat.key],
      })),
    [counters],
  )

  return (
    <section ref={ref} className='stats-v2 relative overflow-hidden py-20 sm:py-24'>
      <div className='absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />
      <div className='absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />

      <div className='mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12'>
        <div className='grid grid-cols-2 gap-px lg:grid-cols-4'>
          {displayStats.map((stat, index) => (
            <div
              key={stat.key}
              className={cn('stat-cell relative px-6 py-8 sm:py-10', visible && 'visible')}
              style={{ transitionDelay: `${index * 0.15}s` }}
            >
              {index > 0 ? (
                <div className='absolute top-4 bottom-4 left-0 hidden w-px bg-border/30 lg:block' />
              ) : null}

              <span className='stat-value mb-2 block text-4xl leading-none font-black tracking-tighter text-foreground sm:text-5xl lg:text-6xl'>
                {stat.prefix ?? ''}
                {stat.value}
                {stat.suffix ?? ''}
              </span>
              <span className='text-[10px] font-bold tracking-[0.2em] text-muted-foreground/60 uppercase sm:text-xs'>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
