import { useState } from 'react'

import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
} from '@/components/ui/accordion'
import { useInView } from '@/components/blocks/sc-directory-v2/use-in-view'
import { cn } from '@/lib/utils'

interface Step {
   id: string
   title: string
   description: string
   features: Array<string>
}

const steps: Array<Step> = [
   {
      id: '01',
      title: 'Create Your Profile',
      description:
         'Set up your startup or investor profile in minutes. Rich media, pitch decks, and team spotlights, everything investors need at a glance.',
      features: ['Rich media profiles', 'Pitch deck uploads', 'Team member showcase', 'Milestone tracking'],
   },
   {
      id: '02',
      title: 'Get Discovered',
      description:
         'Our AI-powered matching and searchable directory put you in front of the right investors. Real-time analytics show who is watching.',
      features: ['Smart investor matching', 'Searchable placement', 'Profile analytics', 'Featured opportunities'],
   },
   {
      id: '03',
      title: 'Connect & Grow',
      description:
         'From first intro to term sheet, our platform facilitates the entire funding journey with secure messaging, scheduling, and deal rooms.',
      features: ['Encrypted messaging', 'Meeting scheduling', 'Due diligence rooms', 'Deal tracking'],
   },
]

export function HowItWorksV2() {
   const { ref, visible } = useInView<HTMLElement>({ threshold: 0.15 })
   const [activeStep, setActiveStep] = useState('01')

   const handleValueChange = (value: Array<string | null>): void => {
      const [nextValue] = value
      if (typeof nextValue === 'string' && nextValue.length > 0) {
         setActiveStep(nextValue)
      }
   }

   return (
      <section ref={ref} id='how-it-works-v2' className='hiw-v2 relative overflow-hidden py-24 sm:py-36'>
         {/* <div className='grain-overlay' /> */}

         <div className='absolute inset-0 -z-10'>
            <div className='absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent' />
         </div>

         <div className='mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12'>
            <div className={cn('section-intro', visible && 'visible')}>
               <div className='mb-6 flex items-center gap-4'>
                  <span className='block h-px w-12 bg-accent' />
                  <span className='text-[10px] font-bold tracking-[0.3em] text-accent uppercase sm:text-xs'>
                     Process
                  </span>
               </div>
               <h2 className='mb-6 text-4xl leading-[0.9] font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
                  Three Steps
                  <br />
                  to Success
               </h2>
               <p className='mb-20 max-w-lg text-base leading-relaxed text-muted-foreground'>
                  A streamlined process from listing to funding. We&apos;ve facilitated over $50M in capital for
                  African startups.
               </p>
            </div>

            <Accordion
               value={[activeStep]}
               onValueChange={handleValueChange}
               className={cn('steps-container border-0 rounded-none overflow-visible bg-transparent', visible && 'visible')}
            >
               {steps.map((step, index) => (
                  <AccordionItem
                     key={step.id}
                     value={step.id}
                     className={cn(
                        'step-row group w-full text-left border-b-0 bg-transparent data-open:bg-transparent',
                        visible && 'visible',
                        activeStep === step.id && 'active',
                     )}
                     style={{ transitionDelay: `${index * 0.1}s` }}
                  >
                     <div className='h-px w-full bg-border/40 first:bg-border/60' />

                     <AccordionTrigger
                        className='p-0 hover:no-underline border-none **:data-[slot=accordion-trigger-icon]:hidden'
                     >
                        <div className='flex w-full items-start gap-6 py-8 sm:gap-10 sm:py-10'>
                           <span
                              className={cn(
                                 'step-number shrink-0 select-none text-5xl leading-none font-black transition-colors duration-500 sm:text-7xl',
                                 activeStep === step.id ? 'text-primary' : 'text-muted-foreground/15',
                              )}
                           >
                              {step.id}
                           </span>

                           <div className='min-w-0 flex-1'>
                              <div className='flex items-center justify-between gap-4'>
                                 <h3 className='text-xl font-bold tracking-tight text-foreground sm:text-2xl'>
                                    {step.title}
                                 </h3>
                                 <div className='relative flex h-8 w-8 shrink-0 items-center justify-center'>
                                    <span className='block h-px w-4 bg-foreground transition-transform duration-300' />
                                    <span
                                       className={cn(
                                          'absolute block h-px w-4 bg-foreground transition-transform duration-300',
                                          activeStep === step.id ? 'rotate-0' : 'rotate-90',
                                       )}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </AccordionTrigger>

                     <AccordionContent className='h-(--accordion-panel-height) pt-0 pb-0 [&_p:not(:last-child)]:mb-0'>
                        <div className='step-content mt-6 pb-8 sm:pb-10'>
                           <p className='mb-6 max-w-2xl leading-relaxed text-muted-foreground'>{step.description}</p>

                           <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
                              {step.features.map((feature, featureIndex) => (
                                 <div
                                    key={feature}
                                    className='feature-chip border border-border/30 bg-muted/20 px-4 py-3 transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.03]'
                                    style={{ transitionDelay: `${featureIndex * 0.05}s` }}
                                 >
                                    <span className='text-xs font-medium text-muted-foreground'>{feature}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </AccordionContent>
                  </AccordionItem>
               ))}
               <div className='h-px w-full bg-border/40' />
            </Accordion>
         </div>
      </section>
   )
}
