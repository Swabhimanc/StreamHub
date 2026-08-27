import { useEffect, useRef } from 'react'

export default function AdSlot({
  zoneId,
  className = '',
  style = {},
  label = true,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let scriptEl = null

    const interval = setInterval(() => {
      if (cancelled) {
        clearInterval(interval)
        return
      }
      if (window.aclib && typeof window.aclib.runBanner === 'function') {
        clearInterval(interval)
        scriptEl = document.createElement('script')
        scriptEl.type = 'text/javascript'
        scriptEl.text = `aclib.runBanner({ zoneId: '${zoneId}' });`
        container.appendChild(scriptEl)
      }
    }, 200)

    return () => {
      cancelled = true
      clearInterval(interval)
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl)
      }
    }
  }, [zoneId])

  return (
    <div className={`rounded-xl border border-white/10 bg-surface p-3 ${className}`} style={style}>
      {label && (
        <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-mist">
          Advertisement
        </p>
      )}
      <div ref={containerRef} className="min-h-[90px]" />
    </div>
  )
}
