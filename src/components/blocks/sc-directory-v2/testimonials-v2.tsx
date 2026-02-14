import { useEffect, useState } from 'react'

import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

interface Testimonial {
   id: number
   name: string
   role: string
   company: string
   quote: string
   metric: string
   initials: string
}

const testimonials: Array<Testimonial> = [
   {
      id: 1,
      name: 'Kwame Asante',
      role: 'CEO',
      company: 'PayFlow',
      quote:
         'StartupConnect transformed our fundraising journey. Within 3 months we secured our Series A from two incredible investors who found us through the platform.',
      metric: '$2.5M raised',
      initials: 'KA',
   },
   {
      id: 2,
      name: 'Ama Owusu',
      role: 'Partner',
      company: 'Stellar Ventures',
      quote:
         'The quality of deal flow on StartupConnect is unmatched. Every startup is properly vetted, and the data rooms make due diligence seamless.',
      metric: '12 investments',
      initials: 'AO',
   },
   {
      id: 3,
      name: 'Yaw Boateng',
      role: 'Founder',
      company: 'GreenHarvest',
      quote:
         'From a small AgriTech project in Kumasi to a funded startup serving 10,000 farmers, StartupConnect gave us the visibility we needed.',
      metric: '$1.2M raised',
      initials: 'YB',
   },
]

export function TestimonialsV2() {
   const { ref, visible } = useInView<HTMLElement>({ threshold: 0.2 })
   const [activeIndex, setActiveIndex] = useState(0)

   useEffect(() => {
      const interval = window.setInterval(() => {
         setActiveIndex((prev) => (prev + 1) % testimonials.length)
      }, 6000)

      return () => {
         window.clearInterval(interval)
      }
   }, [])

   return (
      <section ref={ref} className='testimonials-v2 relative overflow-hidden py-24 sm:py-36'>
         <div className='grain-overlay' />

         <div className='absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />

         <div className='mx-auto max-w-350 px-6 sm:px-8 lg:px-12'>
            <div className={cn('section-intro', visible && 'visible')}>
               <div className='mb-6 flex items-center gap-4'>
                  <span className='block h-px w-12 bg-primary' />
                  <span className='text-[10px] font-bold tracking-[0.3em] text-primary uppercase sm:text-xs'>
                     Voices
                  </span>
               </div>
            </div>

            <div className={cn('testimonial-area', visible && 'visible')}>
               <div className='grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16'>
                  <div className='lg:col-span-8'>
                     <div className='testimonial-stack relative min-h-112 sm:min-h-96 lg:min-h-104'>
                        {testimonials.map((testimonial, index) => (
                           <div
                              key={testimonial.id}
                              className={cn(
                                 'testimonial-slide absolute inset-0 transition-all duration-700 ease-out',
                                 index === activeIndex
                                    ? 'pointer-events-auto translate-y-0 opacity-100'
                                    : 'pointer-events-none translate-y-4 opacity-0',
                              )}
                              aria-hidden={index !== activeIndex}
                           >
                              <span className='-mb-16 block select-none font-serif text-[120px] leading-none text-primary/10 sm:-mb-24 sm:text-[180px]'>
                                 &quot;
                              </span>

                              <blockquote className='mb-10 text-2xl leading-snug font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl'>
                                 {testimonial.quote}
                              </blockquote>

                              <div className='flex items-center gap-4'>
                                 <div className='flex h-12 w-12 items-center justify-center bg-foreground text-sm font-black tracking-wider text-background'>
                                    {testimonial.initials}
                                 </div>
                                 <div>
                                    <span className='block text-sm font-bold text-foreground'>{testimonial.name}</span>
                                    <span className='block text-xs text-muted-foreground'>
                                       {testimonial.role}, {testimonial.company}
                                    </span>
                                 </div>
                                 <span className='ml-auto bg-primary/10 px-3 py-1.5 text-xs font-bold tracking-wider text-primary uppercase'>
                                    {testimonial.metric}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className='flex justify-start gap-3 lg:col-span-4 lg:flex-col'>
                     {testimonials.map((testimonial, index) => (
                        <button
                           type='button'
                           key={testimonial.id}
                           onClick={() => setActiveIndex(index)}
                           className={cn(
                              'nav-card w-full border p-5 text-left transition-all duration-300',
                              index === activeIndex
                                 ? 'border-primary/30 bg-primary/3'
                                 : 'border-border/30 hover:border-border/60',
                           )}
                        >
                           <div className='mb-2 flex items-center gap-3'>
                              <div
                                 className={cn(
                                    'flex h-8 w-8 items-center justify-center text-[10px] font-bold',
                                    index === activeIndex
                                       ? 'bg-primary text-primary-foreground'
                                       : 'bg-muted text-muted-foreground',
                                 )}
                              >
                                 {testimonial.initials}
                              </div>
                              <div>
                                 <span className='block text-xs font-bold text-foreground'>{testimonial.name}</span>
                                 <span className='block text-[10px] text-muted-foreground'>{testimonial.company}</span>
                              </div>
                           </div>
                           {index === activeIndex ? (
                              <div className='mt-3 h-px overflow-hidden bg-border/30'>
                                 <div className='progress-fill h-full bg-primary' />
                              </div>
                           ) : null}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </section>
   )
}
