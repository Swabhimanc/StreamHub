import { useEffect, useRef } from 'react'

const ADSENSE_CLIENT = 'ca-pub-5083478504723257'

export default function AdSlot({
  slot,
  format = 'auto',
  layoutKey,
  responsive = true,
  className = '',
  style = {},
  label = true,
}) {
  const adRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return

    try {
      if (adRef.current && adRef.current.children.length === 0) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        initializedRef.current = true
      }
    } catch {
      // AdSense not loaded yet or blocked
    }
  }, [])

  const adAttrs = {
    style: { display: 'block', ...style },
    'data-ad-client': ADSENSE_CLIENT,
    'data-ad-slot': slot,
    ...(format === 'fluid'
      ? { 'data-ad-format': 'fluid', 'data-ad-layout-key': layoutKey }
      : {
          'data-ad-format': format,
          ...(responsive && { 'data-full-width-responsive': 'true' }),
        }),
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-surface p-3 ${className}`}>
      {label && (
        <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-mist">
          Advertisement
        </p>
      )}
      <ins ref={adRef} className="adsbygoogle" {...adAttrs} />
    </div>
  )
}
