import { useEffect, useRef, useState, useCallback } from 'react'
import { VASTClient, VASTTracker } from '@dailymotion/vast-client'
import { SpinnerIcon } from './icons.jsx'

const VAST_TAG_URL = 'https://youradexchange.com/video/select.php?r=12057730'

export default function VideoAd({ onComplete }) {
  const videoRef = useRef(null)
  const trackerRef = useRef(null)
  const completedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [mediaUrl, setMediaUrl] = useState(null)
  const [skipDelay, setSkipDelay] = useState(null)
  const [canSkip, setCanSkip] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [muted, setMuted] = useState(true)

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  useEffect(() => {
    let cancelled = false
    const vastClient = new VASTClient()

    vastClient
      .get(VAST_TAG_URL)
      .then((res) => {
        if (cancelled) return
        if (!res.ads || !res.ads.length) {
          finish()
          return
        }

        const ad = res.ads[0]
        const linearCreative = ad.creatives?.find((c) => c.mediaFiles?.length)
        if (!linearCreative) {
          finish()
          return
        }

        const mp4 = linearCreative.mediaFiles.find((f) => f.mimeType === 'video/mp4')
        const chosen = mp4 || linearCreative.mediaFiles[0]
        if (!chosen?.fileURL) {
          finish()
          return
        }

        const tracker = new VASTTracker(vastClient, ad, linearCreative, null, true)
        trackerRef.current = tracker

        setMediaUrl(chosen.fileURL)
        setSkipDelay(linearCreative.skipDelay ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        finish()
      })

    return () => {
      cancelled = true
    }
  }, [finish])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const tracker = trackerRef.current
    if (tracker) tracker.setProgress(video.currentTime)

    if (skipDelay !== null && skipDelay > 0 && video.currentTime < skipDelay) {
      setCanSkip(false)
      setCountdown(Math.ceil(skipDelay - video.currentTime))
    } else if (skipDelay !== null) {
      setCanSkip(true)
    }
  }, [skipDelay])

  const handlePlay = useCallback(() => {
    const tracker = trackerRef.current
    if (tracker) {
      tracker.trackImpression()
      tracker.track('start')
    }
  }, [])

  const handleEnded = useCallback(() => {
    const tracker = trackerRef.current
    if (tracker) tracker.track('complete')
    finish()
  }, [finish])

  const handleSkip = useCallback(() => {
    const tracker = trackerRef.current
    if (tracker) tracker.skip()
    finish()
  }, [finish])

  const handleError = useCallback(() => {
    finish()
  }, [finish])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
    const tracker = trackerRef.current
    if (tracker) tracker.setMuted(video.muted)
  }, [])

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black">
        <SpinnerIcon className="h-8 w-8 text-brand" />
        <span className="text-xs font-semibold uppercase tracking-widest text-mist">Loading ad…</span>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={mediaUrl}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
        Ad
      </div>

      <button
        onClick={toggleMute}
        className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {skipDelay !== null && !canSkip && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/70 px-4 py-2 text-xs font-bold text-white/80">
          Skip in {countdown}s
        </div>
      )}

      {canSkip && (
        <button
          onClick={handleSkip}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-4 py-2 text-xs font-black text-black transition hover:bg-white"
        >
          Skip Ad
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.59 7.41 7 6l6 6-6 6-1.41-1.41L10.17 12zM16 6h2v12h-2z" />
          </svg>
        </button>
      )}

      {skipDelay === null && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/70 px-4 py-2 text-xs font-bold text-white/60">
          Advertisement
        </div>
      )}
    </div>
  )
}
