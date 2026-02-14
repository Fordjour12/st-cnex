import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface FooterColumn {
  title: string
  links: Array<{ label: string; href: string }>
}

const columns: Array<FooterColumn> = [
  {
    title: 'Product',
    links: [
      { label: 'Directory', href: '/directory' },
      { label: 'For Startups', href: '/startups' },
      { label: 'For Investors', href: '/investors' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Success Stories', href: '/success-stories' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'API', href: '/api' },
      { label: 'Community', href: '/community' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Support', href: '/support' },
    ],
  },
]

const socials = [
  { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { Icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { Icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
]

export function FooterV2() {
  return (
    <footer className='footer-v2 relative border-t border-border/30 bg-card/20'>
      <div className='border-b border-border/20'>
        <div className='mx-auto max-w-[1400px] px-6 py-14 sm:px-8 lg:px-12'>
          <div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-12'>
            <div className='lg:col-span-5'>
              <h3 className='mb-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl'>
                Stay ahead
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Weekly insights on Africa&apos;s hottest startups and investment opportunities.
              </p>
            </div>
            <div className='lg:col-span-7 lg:pl-12'>
              <form className='flex gap-0'>
                <Input
                  type='email'
                  placeholder='your@email.com'
                  className='h-12 flex-grow rounded-none border-foreground/15 bg-background/30 text-sm focus:border-primary'
                />
                <button className='h-12 shrink-0 bg-foreground px-8 text-xs font-bold tracking-wider text-background uppercase transition-colors duration-300 hover:bg-primary hover:text-primary-foreground'>
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-[1400px] px-6 py-16 sm:px-8 lg:px-12'>
        <div className='grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6'>
          <div className='col-span-2'>
            <a href='/' className='mb-5 flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center bg-foreground'>
                <img src='/logo.svg' alt='Logo' className='h-4 w-4 invert' />
              </div>
              <span className='text-base font-black tracking-tight text-foreground'>StartupConnect</span>
            </a>
            <p className='mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground'>
              Connecting visionary startups with strategic investors. Building the future of African
              innovation.
            </p>
            <div className='flex gap-1'>
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className='flex h-9 w-9 items-center justify-center text-muted-foreground/50 transition-all duration-200 hover:bg-foreground/5 hover:text-foreground'
                >
                  <social.Icon className='h-4 w-4' />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className='mb-5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase'>
                {column.title}
              </h4>
              <ul className='space-y-3'>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className='text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground'
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className='border-t border-border/20'>
        <div className='mx-auto max-w-[1400px] px-6 py-5 sm:px-8 lg:px-12'>
          <div className='flex flex-col items-center justify-between gap-4 text-[10px] tracking-[0.15em] text-muted-foreground/40 uppercase sm:flex-row'>
            <span>© {new Date().getFullYear()} StartupConnect. All rights reserved.</span>
            <div className='flex gap-6'>
              <a href='/terms' className='transition-colors hover:text-foreground'>
                Terms
              </a>
              <a href='/privacy' className='transition-colors hover:text-foreground'>
                Privacy
              </a>
              <a href='/cookies' className='transition-colors hover:text-foreground'>
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
