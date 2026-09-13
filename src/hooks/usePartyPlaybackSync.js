import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlayerBridge } from './usePlayerBridge.js'

const HOST_EVENT_MIN_INTERVAL_MS = 800
const SEEK_JUMP_TOLERANCE_S = 4
const APPLY_SETTLE_MS = 4000
const DRIFT_TOLERANCE_S = 3.5
const CONVERGED_TOLERANCE_S = 2.5
const BLOCKED_AFTER_MS = 7000
const BLOCKED_SILENCE_MS = 5000
const CHECK_INTERVAL_MS = 3000

// Host-driven playback sync over the party WebSocket.
//
// Host side: watches its own player telemetry and broadcasts state transitions
// (play / pause / seek) via `sendPartyEvent`. Also publishes a full state
// snapshot when the player becomes ready and whenever a member requests sync.
//
// Member side: applies incoming room events to its own player (seek + match
// play/pause), runs periodic drift correction, and surfaces a status:
//   idle        - host has not started playback yet
//   syncing     - applying the latest room state
//   synced      - converged with the host's expected position
//   blocked     - own player could not autoplay; needs one manual tap
//   unavailable - provider exposes no player telemetry (fall back to screen share)
export function usePartyPlaybackSync({
  iframeRef,
  playerUrl,
  connected,
  isHost,
  active = true,
  lastEvent,
  sendPartyEvent,
  syncRequestId,
}) {
  const bridgeActive = Boolean(connected && playerUrl && (isHost || active))
  const bridge = usePlayerBridge({ iframeRef, playerUrl, active: bridgeActive })

  const [status, setStatus] = useState('idle')
  const statusRef = useRef('idle')
  const pendingEventRef = useRef(null)
  const expectedRef = useRef(null)
  const applyingUntilRef = useRef(0)

  const setSyncStatus = useCallback((next) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  // New media remounts the iframe: drop stale expectations until fresh telemetry arrives.
  useEffect(() => {
    pendingEventRef.current = null
    expectedRef.current = null
    applyingUntilRef.current = 0
    setSyncStatus('idle')
  }, [playerUrl, setSyncStatus])

  const applyEvent = useCallback(
    (event) => {
      if (!event || typeof event.time !== 'number' || !bridgeActive) return
      const playing = !event.paused
      let target = event.time
      if (playing && typeof event.at === 'number') {
        target += (Date.now() - event.at) / 1000
      }
      const s = bridge.getState()
      if (s.duration) target = Math.min(Math.max(0, target), Math.max(0, s.duration - 0.5))
      applyingUntilRef.current = Date.now() + APPLY_SETTLE_MS
      bridge.seek(target)
      if (playing) bridge.play()
      else bridge.pause()
      expectedRef.current = { baseTime: target, baseAt: Date.now(), playing }
      setSyncStatus('syncing')
    },
    [bridge, bridgeActive, setSyncStatus]
  )

  // Host: broadcast play/pause/seek transitions to the room.
  useEffect(() => {
    if (!isHost || !bridgeActive) return
    let prev = null
    let lastSentAt = 0
    return bridge.subscribe((s) => {
      const now = Date.now()
      if (prev) {
        const elapsed = (now - prev.updatedAt) / 1000
        const progressed = s.time - prev.time
        const pausedChanged = prev.paused !== s.paused
        const seeked = Math.abs(progressed - elapsed) > SEEK_JUMP_TOLERANCE_S
        if (pausedChanged || (seeked && now - lastSentAt >= HOST_EVENT_MIN_INTERVAL_MS)) {
          lastSentAt = now
          sendPartyEvent({
            action: pausedChanged ? (s.paused ? 'pause' : 'play') : 'seek',
            time: s.time,
            paused: s.paused,
            at: now,
          })
        }
      }
      prev = s
    })
  }, [isHost, bridgeActive, bridge, sendPartyEvent])

  const sendCurrentState = useCallback(
    (action = 'sync') => {
      const s = bridge.getState()
      sendPartyEvent({
        action,
        time: s.time,
        paused: s.paused ?? true,
        at: Date.now(),
      })
    },
    [bridge, sendPartyEvent]
  )

  // Host: publish state once the player reports telemetry (covers late joiners).
  useEffect(() => {
    if (isHost && bridgeActive && bridge.ready) sendCurrentState('sync')
  }, [isHost, bridgeActive, bridge, bridge.ready, sendCurrentState])

  // Host: answer explicit member re-sync requests.
  useEffect(() => {
    if (isHost && syncRequestId > 0 && bridgeActive && bridge.ready) {
      sendCurrentState('sync')
    }
  }, [isHost, syncRequestId, bridgeActive, bridge, bridge.ready, sendCurrentState])

  // Member: apply the latest room event (and re-apply once telemetry is ready).
  useEffect(() => {
    if (isHost || !bridgeActive || !lastEvent) return
    pendingEventRef.current = lastEvent
    if (bridge.ready) applyEvent(lastEvent)
  }, [lastEvent, isHost, bridgeActive, bridge.ready, applyEvent])

  // Member: watch own telemetry for convergence and unblock after manual start.
  useEffect(() => {
    if (isHost || !bridgeActive) return
    return bridge.subscribe((s) => {
      const now = Date.now()
      if (statusRef.current === 'unavailable') setSyncStatus('syncing')
      if (statusRef.current === 'blocked' && s.paused === false) {
        setSyncStatus('synced')
        return
      }
      if (now < applyingUntilRef.current) return
      const exp = expectedRef.current
      if (!exp) return
      const expectedTime = exp.playing
        ? exp.baseTime + (now - exp.baseAt) / 1000
        : exp.baseTime
      if (Math.abs(s.time - expectedTime) <= CONVERGED_TOLERANCE_S && s.paused === !exp.playing) {
        if (statusRef.current !== 'synced') setSyncStatus('synced')
      }
    })
  }, [isHost, bridgeActive, bridge, setSyncStatus])

  // Member: periodic drift correction, blocked/unavailable detection.
  useEffect(() => {
    if (isHost || !bridgeActive) return
    const id = setInterval(() => {
      const now = Date.now()
      if (now < applyingUntilRef.current) return
      const exp = expectedRef.current
      if (!exp) return
      const s = bridge.getState()

      if (exp.playing && !bridge.hasTelemetry) {
        if (statusRef.current !== 'unavailable') setSyncStatus('unavailable')
        return
      }

      const expectedTime = exp.playing
        ? exp.baseTime + (now - exp.baseAt) / 1000
        : exp.baseTime
      const drift = Math.abs(s.time - expectedTime)

      if (drift <= CONVERGED_TOLERANCE_S && s.paused === !exp.playing) {
        if (statusRef.current !== 'synced') setSyncStatus('synced')
        return
      }
      if (exp.playing && s.paused === false && drift > DRIFT_TOLERANCE_S) {
        bridge.seek(expectedTime)
        bridge.play()
        applyingUntilRef.current = now + APPLY_SETTLE_MS
        setSyncStatus('syncing')
        return
      }
      if (
        exp.playing &&
        now - exp.baseAt > BLOCKED_AFTER_MS &&
        (s.paused !== false || now - bridge.getLastMessageAt() > BLOCKED_SILENCE_MS)
      ) {
        if (statusRef.current !== 'blocked') setSyncStatus('blocked')
      }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isHost, bridgeActive, bridge, setSyncStatus])

  return { status: isHost ? 'host' : status, bridge }
}
