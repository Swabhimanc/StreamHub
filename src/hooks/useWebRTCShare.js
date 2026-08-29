import { useCallback, useEffect, useRef, useState } from 'react'

function buildRtcConfig() {
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]
  const turnUrl = import.meta.env.VITE_TURN_URL
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USER || undefined,
      credential: import.meta.env.VITE_TURN_CRED || undefined,
    })
  }
  return { iceServers }
}

const RTC_CONFIG = buildRtcConfig()

export const SHARE_QUALITY_PRESETS = {
  light: { label: 'Light', video: 2_500_000, audio: 96_000, downscale: 2, fps: 30 },
  balanced: { label: 'Balanced', video: 6_000_000, audio: 128_000, downscale: 1, fps: 30 },
  hd: { label: 'HD', video: 10_000_000, audio: 192_000, downscale: 1, fps: 60 },
}

const AUDIO_CONSTRAINTS_RICH = {
  sampleRate: 48000,
  channelCount: 2,
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
}

const VIDEO_CONSTRAINTS = {
  frameRate: { ideal: 60, max: 60 },
  width: { max: 1920 },
  height: { max: 1080 },
}

const EXTRA_CAPTURE_OPTIONS = {
  surfaceSwitching: 'include',
  selfBrowserSurface: 'include',
  systemAudio: 'include',
}

function applyVideoCodecPreferences(pc) {
  try {
    const caps = RTCRtpSender.getCapabilities?.('video')
    if (!caps || !caps.codecs) return
    const rank = (codec) => {
      const mime = (codec.mimeType || '').toLowerCase()
      if (mime === 'video/h264') return 0
      if (mime === 'video/vp9') return 1
      if (mime === 'video/vp8') return 2
      return 3
    }
    // Only primary video codecs — keep rtx/red/flexfec out of the preference list
    const primaryCodecs = caps.codecs.filter((c) =>
      ['video/h264', 'video/vp9', 'video/vp8', 'video/av1'].includes((c.mimeType || '').toLowerCase())
    )
    const ordered = [...primaryCodecs].sort((a, b) => rank(a) - rank(b))
    if (ordered.length === 0) return
    for (const transceiver of pc.getTransceivers()) {
      if (transceiver.sender?.track?.kind === 'video') {
        try { transceiver.codecPreferences = ordered } catch {}
      }
    }
  } catch {}
}

export function useWebRTCHost({ participantId, participants, relay, onRelay, sendShareSignal, active }) {
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState(null)
  const [quality, setQualityKey] = useState('hd')
  const [audioUnavailable, setAudioUnavailable] = useState(false)
  const [displaySurface, setDisplaySurface] = useState(null)

  const streamRef = useRef(null)
  const peersRef = useRef(new Map())
  const peerQualityRef = useRef(new Map())
  const statsPrevRef = useRef(new Map())
  const qualityRef = useRef(quality)
  qualityRef.current = quality
  const sharingRef = useRef(false)
  sharingRef.current = sharing
  const participantIdRef = useRef(participantId)
  participantIdRef.current = participantId
  const relayRef = useRef(relay)
  relayRef.current = relay
  const sendShareSignalRef = useRef(sendShareSignal)
  sendShareSignalRef.current = sendShareSignal

  const applyEncodingSettingsToPc = useCallback(async (pc, qualityKey) => {
    const preset = SHARE_QUALITY_PRESETS[qualityKey] || SHARE_QUALITY_PRESETS.balanced
    for (const sender of pc.getSenders()) {
      const track = sender.track
      if (!track) continue
      try {
        const params = sender.getParameters()
        if (!params.encodings || params.encodings.length === 0) params.encodings = [{}]
        if (track.kind === 'video') {
          params.encodings[0].maxBitrate = preset.video
          params.encodings[0].maxFramerate = preset.fps || 30
          params.encodings[0].scaleResolutionDownBy = preset.downscale
        } else {
          params.encodings[0].maxBitrate = preset.audio
        }
        // Keep pixels sharp for cinematic content; let framerate absorb congestion instead
        params.degradationPreference = 'maintain-resolution'
        await sender.setParameters(params)
      } catch {}
    }
  }, [])

  const applyEncodingSettings = useCallback(async (peerId, pc) => {
    const qualityKey = peerQualityRef.current.get(peerId) || qualityRef.current
    return applyEncodingSettingsToPc(pc, qualityKey)
  }, [applyEncodingSettingsToPc])

  const closePeer = useCallback((peerId) => {
    const pc = peersRef.current.get(peerId)
    if (pc) {
      try { pc.close() } catch {}
      peersRef.current.delete(peerId)
    }
    statsPrevRef.current.delete(peerId)
  }, [])

  const createPeerForViewer = useCallback(async (viewerId) => {
    if (!streamRef.current || peersRef.current.has(viewerId)) return
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peersRef.current.set(viewerId, pc)

      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current))
      applyVideoCodecPreferences(pc)

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          relayRef.current(viewerId, { kind: 'ice', candidate: e.candidate })
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          closePeer(viewerId)
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      relayRef.current(viewerId, { kind: 'offer', sdp: pc.localDescription })
      await applyEncodingSettings(viewerId, pc)
    } catch {
      closePeer(viewerId)
    }
  }, [applyEncodingSettings, closePeer])

  const stopShareInternal = useCallback((options = {}) => {
    const { notify = true } = options
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => { try { t.stop() } catch {} })
      streamRef.current = null
    }
    for (const [peerId] of peersRef.current) closePeer(peerId)
    peersRef.current.clear()
    setDisplaySurface(null)
    setAudioUnavailable(false)
    if (sharingRef.current) {
      setSharing(false)
      if (notify) sendShareSignalRef.current('stop')
    }
  }, [closePeer])

  const startShare = useCallback(async () => {
    setShareError(null)
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setShareError('Screen sharing is not supported in this browser (needs HTTPS).')
      return false
    }

    const attempts = [
      { audio: AUDIO_CONSTRAINTS_RICH },
      { audio: true },
      { audio: false },
    ]

    let stream = null
    let lastError = null
    for (const attempt of attempts) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: VIDEO_CONSTRAINTS,
          ...EXTRA_CAPTURE_OPTIONS,
          audio: attempt.audio,
        })
        if (stream) {
          setAudioUnavailable(attempt.audio === false || stream.getAudioTracks().length === 0)
          break
        }
      } catch (err) {
        lastError = err
        if (err?.name === 'NotAllowedError') return false
      }
    }

    if (!stream) {
      const name = lastError?.name
      if (name !== 'NotAllowedError') {
        setShareError(`Screen share failed: ${lastError?.message || name || 'unknown error'}`)
      }
      return false
    }

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      try { videoTrack.contentHint = 'detail' } catch {}
      try {
        const settings = videoTrack.getSettings?.()
        if (settings?.displaySurface) setDisplaySurface(settings.displaySurface)
      } catch {}
      videoTrack.addEventListener('ended', () => stopShareInternal())
    }

    streamRef.current = stream
    setSharing(true)
    sendShareSignalRef.current('start')
    return true
  }, [stopShareInternal])

  const stopShare = useCallback(() => stopShareInternal(), [stopShareInternal])

  const setQuality = useCallback((key) => {
    setQualityKey(key)
    for (const [peerId, pc] of peersRef.current) {
      applyEncodingSettings(peerId, pc)
    }
  }, [applyEncodingSettings])

  const collectStats = useCallback(async () => {
    const out = []
    for (const [peerId, pc] of peersRef.current) {
      try {
        const stats = await pc.getStats()
        let fps = 0
        let bitsPerSecond = 0
        let packetsLost = 0
        let codecMime = null
        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && (report.mediaType === 'video' || report.kind === 'video')) {
            fps = report.framesPerSecond || 0
            const prev = statsPrevRef.current.get(peerId)
            if (prev && report.timestamp > prev.timestamp) {
              const dt = (report.timestamp - prev.timestamp) / 1000
              const dBytes = report.bytesSent - prev.bytesSent
              if (dt > 0) bitsPerSecond = (dBytes * 8) / dt
            }
            statsPrevRef.current.set(peerId, { timestamp: report.timestamp, bytesSent: report.bytesSent })
          }
          if (report.type === 'remote-inbound-rtp' && (report.mediaType === 'video' || report.kind === 'video')) {
            packetsLost = report.packetsLost || 0
          }
          if (report.type === 'codec' && report.payloadType !== undefined && report.mimeType?.startsWith('video/')) {
            codecMime = report.mimeType.replace('video/', '')
          }
        })
        out.push({ peerId, fps, mbps: bitsPerSecond / 1_000_000, packetsLost, codec: codecMime, state: pc.connectionState })
      } catch {}
    }
    return out
  }, [])

  useEffect(() => {
    if (!active) {
      stopShareInternal({ notify: false })
      return
    }
    return onRelay(async (from, payload) => {
      if (!payload || typeof payload !== 'object') return
      if (payload.kind === 'viewer-ready') {
        if (!sharingRef.current) return
        closePeer(from)
        await createPeerForViewer(from)
        return
      }
      if (payload.kind === 'quality-request') {
        const requested = payload.quality
        if (SHARE_QUALITY_PRESETS[requested]) {
          peerQualityRef.current.set(from, requested)
          const pc = peersRef.current.get(from)
          if (pc) {
            applyEncodingSettings(from, pc)
          }
        }
        return
      }
      const pc = peersRef.current.get(from)
      if (!pc) return
      try {
        if (payload.kind === 'answer' && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        } else if (payload.kind === 'ice' && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        }
      } catch {}
    })
  }, [active, onRelay, stopShareInternal, closePeer, createPeerForViewer, applyEncodingSettings])

  useEffect(() => {
    if (!sharing || !participantId) return
    participants.forEach((p) => {
      if (p.id !== participantId && !peersRef.current.has(p.id)) {
        createPeerForViewer(p.id)
      }
    })
  }, [sharing, participants, participantId, createPeerForViewer])

  useEffect(() => () => stopShareInternal({ notify: false }), [stopShareInternal])

  return {
    sharing,
    shareError,
    quality,
    setQuality,
    startShare,
    stopShare,
    audioUnavailable,
    displaySurface,
    collectStats,
  }
}

export function useWebRTCViewer({ shareActive, hostId, relay, onRelay, active }) {
  const [remoteStream, setRemoteStream] = useState(null)
  const [viewerError, setViewerError] = useState(null)
  const [reconnectTick, setReconnectTick] = useState(0)

  const pcRef = useRef(null)
  const relayRef = useRef(relay)
  relayRef.current = relay
  const hostIdRef = useRef(hostId)
  hostIdRef.current = hostId
  const attemptsRef = useRef(0)

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.close() } catch {}
      pcRef.current = null
    }
    setRemoteStream(null)
  }, [])

  const requestStream = useCallback(() => {
    const hid = hostIdRef.current
    if (hid) {
      relayRef.current(hid, { kind: 'viewer-ready' })
    }
  }, [])

  const requestQuality = useCallback((quality) => {
    const hid = hostIdRef.current
    if (hid && SHARE_QUALITY_PRESETS[quality]) {
      relayRef.current(hid, { kind: 'quality-request', quality })
    }
  }, [])

  useEffect(() => {
    if (!active) return
    return onRelay(async (from, payload) => {
      if (!payload || typeof payload !== 'object') return
      try {
        if (payload.kind === 'offer' && payload.sdp) {
          if (pcRef.current) {
            try { pcRef.current.close() } catch {}
          }
          const pc = new RTCPeerConnection(RTC_CONFIG)
          pcRef.current = pc

          pc.ontrack = (e) => {
            if (e.streams && e.streams[0]) {
              attemptsRef.current = 0
              setRemoteStream(e.streams[0])
            }
          }

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              relayRef.current(from, { kind: 'ice', candidate: e.candidate })
            }
          }

          pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') {
              setViewerError('Stream connection lost.')
              cleanup()
              setReconnectTick((n) => n + 1)
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          relayRef.current(from, { kind: 'answer', sdp: pc.localDescription })
        } else if (payload.kind === 'ice' && payload.candidate) {
          const pc = pcRef.current
          if (pc) {
            try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)) } catch {}
          }
        }
      } catch (err) {
        setViewerError(err?.message || 'Failed to join stream')
      }
    })
  }, [active, onRelay, cleanup])

  useEffect(() => {
    if (!shareActive) cleanup()
    attemptsRef.current = 0
  }, [shareActive, cleanup])

  useEffect(() => {
    if (!active || !shareActive || remoteStream) return
    if (attemptsRef.current >= 5) return
    const t = setTimeout(() => {
      attemptsRef.current += 1
      requestStream()
      setReconnectTick((n) => n + 1)
    }, 5000)
    return () => clearTimeout(t)
  }, [active, shareActive, remoteStream, reconnectTick, requestStream])

  useEffect(() => () => cleanup(), [cleanup])

  return { remoteStream, viewerError, requestStream, requestQuality }
}
