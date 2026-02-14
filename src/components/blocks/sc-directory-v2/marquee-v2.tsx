const items = [
  'Fintech',
  'AgriTech',
  'HealthTech',
  'EdTech',
  'E-Commerce',
  'Logistics',
  'AI & ML',
  'Creative',
  'CleanTech',
  'Blockchain',
  'SaaS',
  'PropTech',
  'InsurTech',
  'Mobility',
]

const marqueeItems = [...items, ...items, ...items]

export function MarqueeV2() {
  return (
    <div className='marquee-section relative overflow-hidden border-y border-border/20 py-6'>
      <div className='marquee-track'>
        <div className='marquee-content'>
          {marqueeItems.map((item, index) => (
            <span className='marquee-item' key={`${item}-${index}`}>
              <span className='marquee-dot' />
              <span className='marquee-text'>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
