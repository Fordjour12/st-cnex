import { createFileRoute } from '@tanstack/react-router'

import { CategoriesV2 } from '@/components/blocks/sc-directory-v2/categories-v2'
import { CtaV2 } from '@/components/blocks/sc-directory-v2/cta-v2'
import { DirectoryV2 } from '@/components/blocks/sc-directory-v2/directory-v2'
import { FooterV2 } from '@/components/blocks/sc-directory-v2/footer-v2'
import { HeroV2 } from '@/components/blocks/sc-directory-v2/hero-v2'
import { HowItWorksV2 } from '@/components/blocks/sc-directory-v2/how-it-works-v2'
import { MarqueeV2 } from '@/components/blocks/sc-directory-v2/marquee-v2'
import { StatsV2 } from '@/components/blocks/sc-directory-v2/stats-v2'
import { TestimonialsV2 } from '@/components/blocks/sc-directory-v2/testimonials-v2'
import '@/components/blocks/sc-directory-v2/styles.css'

export const Route = createFileRoute('/v2')({
   head: () => ({
      meta: [
         {
            title: "StartupConnect - Where Africa's Innovation Meets Capital",
         },
         {
            name: 'description',
            content:
               "Discover Ghana's fastest-growing startups, connect with visionary founders, and invest in the future of African tech. All in one curated marketplace.",
         },
      ],
      links: [
         {
            rel: 'stylesheet',
            href: 'https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap',
         },
      ],
   }),
   component: V2Page,
})

function V2Page() {
   return (
      <div className='v2-landing bg-background text-foreground min-h-screen overflow-hidden'>
         <HeroV2 isAuthenticated={false} />
         <MarqueeV2 />
         <StatsV2 />
         <DirectoryV2 />
         <CategoriesV2 />
         <HowItWorksV2 />
         <TestimonialsV2 />
         <CtaV2 />
         <FooterV2 />
      </div>
   )
}
