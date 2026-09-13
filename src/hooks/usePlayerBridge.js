import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Time after iframe load with no player telemetry before we consider the
// provider's postMessage API unavailable for this title.
const NO_TELEMETRY_TIMEOUT_MS = 10_000
const TELEMETRY_HINT_RE = /play|player|video|time|media/i
const MAX_DEBUG_LOGS = 5

function parsePlayerMessage(data) {
  let payload = data
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { return null }
  }
  if (!payload || typeof payload !== 'object') return null

  // VidFast / VidCore envelope (verified against the provider's bundle):
  //   { type: 'PLAYER_EVENT', data: { event, currentTime, duration, playing,
  //                                    tmdbId, mediaType, season, episode, muted, volume } }
  if (payload.type === 'PLAYER_EVENT' && payload.data && typeof payload.data === 'object') {
    const d = payload.data
    const time = Number(d.currentTime)
    if (!Number.isFinite(time) || time < 0) return null
    return {
      time,
      duration: Number.isFinite(Number(d.duration)) ? Number(d.duration) : 0,
      paused: typeof d.playing === 'boolean' ? !d.playing : null,
    }
  }

  // Provider activity beacons that carry no seekable position but prove the
  // embed is alive: MEDIA_DATA (progress mirror, every 5s) and status codes.
  if (payload.type === 'MEDIA_DATA' && payload.data && typeof payload.data === 'object') {
    return { activityOnly: true, mediaData: payload.data }
  }
  if (payload.event === 'status') {
    return payload.data === 404 ? { activityOnly: true, notFound: true } : { activityOnly: true }
  }

  // Generic "player:timeupdate"-style envelope.
  const type = typeof payload.type === 'string' ? payload.type : ''
  if (!type.includes('timeupdate')) return null
  const time = Number(payload.time ?? payload.currentTime)
  if (!Number.isFinite(time) || time < 0) return null
  return {
    time,
    duration: Number.isFinite(Number(payload.duration)) ? Number(payload.duration) : 0,
    paused: typeof payload.paused === 'boolean' ? payload.paused : null,
  }
}

// Summarizes messages that look playback-related but don't match the known
// protocol — logged (a few times per player load) so a real-device session can
// reveal a provider's actual message envelope without spamming the console.
function summarizeUnknownPlayerMessage(data) {
  let payload = data
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { return null }
  }
  if (!payload || typeof payload !== 'object') return null
  const type = typeof payload.type === 'string' ? payload.type : ''
  const hasTimeKeys =
    Number.isFinite(Number(payload.time)) ||
    Number.isFinite(Number(payload.currentTime)) ||
    Number.isFinite(Number(payload.duration))
  if (!type && !hasTimeKeys) return null
  if (!hasTimeKeys && !TELEMETRY_HINT_RE.test(type)) return null
  return { type: type || null, keys: Object.keys(payload).slice(0, 12) }
}

// Bridges the party/watch iframe with the VidFast-style postMessage player API:
//   iframe -> parent : { type: 'player:timeupdate', time, duration, paused }
//   parent -> iframe : { type: 'player:play' | 'player:pause' }
//                     { type: 'player:seek', time, exact: true }
// Exposes a subscribe/getState telemetry stream plus play/pause/seek commands.
export function usePlayerBridge({ iframeRef, playerUrl, active = true }) {
  const [ready, setReady] = useState(false)
  const [hasTelemetry, setHasTelemetry] = useState(true)
  const stateRef = useRef({ time: 0, duration: 0, paused: null, updatedAt: 0 })
  const lastMessageAtRef = useRef(0)
  const mediaDataRef = useRef(null)
  const listenersRef = useRef(new Set())

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn)
    return () => listenersRef.current.delete(fn)
  }, [])

  const getState = useCallback(() => ({ ...stateRef.current }), [])

  const getLastMessageAt = useCallback(() => lastMessageAtRef.current, [])

  const getMediaData = useCallback(() => mediaDataRef.current, [])

  // Commands are sent in every recognized envelope — providers that don't
  // support a given shape safely ignore it, and whether a command took effect
  // is observable in the incoming telemetry stream.
  const sendCommand = useCallback(
    (commands) => {
      const win = iframeRef.current?.contentWindow
      if (!win) return
      for (const command of commands) {
        try { win.postMessage(command, '*') } catch {}
      }
    },
    [iframeRef]
  )

  const play = useCallback(
    () => sendCommand([{ type: 'player:play' }, { command: 'play' }]),
    [sendCommand]
  )
  const pause = useCallback(
    () => sendCommand([{ type: 'player:pause' }, { command: 'pause' }]),
    [sendCommand]
  )
  const seek = useCallback(
    (time) =>
      sendCommand([
        { type: 'player:seek', time, currentTime: time, exact: true },
        { command: 'seek', time, exact: true },
        { command: 'seek', value: time },
      ]),
    [sendCommand]
  )

  useEffect(() => {
    if (!active || !playerUrl) return
    setReady(false)
    setHasTelemetry(true)
    stateRef.current = { time: 0, duration: 0, paused: null, updatedAt: 0 }
    mediaDataRef.current = null

    let fallbackTimer = setTimeout(() => setHasTelemetry(false), NO_TELEMETRY_TIMEOUT_MS)
    let debugCount = 0
    let protocolConfirmed = false

    const onMessage = (event) => {
      const iframe = iframeRef.current
      if (!iframe || event.source !== iframe.contentWindow) return
      const parsed = parsePlayerMessage(event.data)
      if (!parsed) {
        if (debugCount < MAX_DEBUG_LOGS) {
          const summary = summarizeUnknownPlayerMessage(event.data)
          if (summary) {
            debugCount += 1
            console.debug('[player-bridge] unrecognized player message', summary)
          }
        }
        return
      }
      if (parsed.activityOnly) {
        // Provider heartbeat (MEDIA_DATA / status): the embed is alive, reset
        // the unavailability timer even before playback starts.
        if (fallbackTimer) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
        lastMessageAtRef.current = Date.now()
        if (parsed.mediaData) mediaDataRef.current = parsed.mediaData
        return
      }
      if (!protocolConfirmed) {
        protocolConfirmed = true
        debugCount = MAX_DEBUG_LOGS
        console.debug('[player-bridge] telemetry active')
      }

      const now = Date.now()
      const prev = stateRef.current
      let paused = parsed.paused
      if (paused === null) {
        if (prev.updatedAt) {
          const elapsed = (now - prev.updatedAt) / 1000
          const advanced = parsed.time - prev.time
          paused = elapsed >= 0 && advanced > 0.15
        } else {
          paused = true
        }
      }

      stateRef.current = {
        time: parsed.time,
        duration: parsed.duration || prev.duration,
        paused,
        updatedAt: now,
      }
      lastMessageAtRef.current = now
      if (fallbackTimer) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
      setHasTelemetry(true)
      setReady(true)
      listenersRef.current.forEach((fn) => {
        try { fn(stateRef.current) } catch {}
      })
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [active, playerUrl, iframeRef])

  return useMemo(
    () => ({ ready, hasTelemetry, getState, getLastMessageAt, getMediaData, subscribe, play, pause, seek }),
    [ready, hasTelemetry, getState, getLastMessageAt, getMediaData, subscribe, play, pause, seek]
  )
}
