import { useCallback, useEffect, useRef, useState } from 'react'

const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

const MIC_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

function measureLevel(stream, audioCtx) {
  try {
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    return () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      return Math.min(1, Math.sqrt(sum / data.length) * 3)
    }
  } catch {
    return () => 0
  }
}

export function useVoiceChat({ active, participantId, participants, voiceParticipants, setVoiceState, relay, onRelay }) {
  const [voiceOn, setVoiceOn] = useState(false)
  const [voiceError, setVoiceError] = useState(null)
  const [muted, setMuted] = useState(false)
  const [peerStates, setPeerStates] = useState({})
  const [levels, setLevels] = useState({})

  const micStreamRef = useRef(null)
  const peersRef = useRef(new Map())
  const audioElsRef = useRef(new Map())
  const remoteStreamsRef = useRef(new Map())
  const audioCtxRef = useRef(null)
  const metersRef = useRef(new Map())

  const voiceOnRef = useRef(false)
  voiceOnRef.current = voiceOn
  const participantIdRef = useRef(participantId)
  participantIdRef.current = participantId
  const relayRef = useRef(relay)
  relayRef.current = relay
  const setVoiceStateRef = useRef(setVoiceState)
  setVoiceStateRef.current = setVoiceState

  const setPeerState = useCallback((peerId, state) => {
    setPeerStates((prev) => {
      if (state === null) {
        if (!(peerId in prev)) return prev
        const next = { ...prev }
        delete next[peerId]
        return next
      }
      if (prev[peerId] === state) return prev
      return { ...prev, [peerId]: state }
    })
  }, [])

  const attachRemoteStream = useCallback((peerId, stream) => {
    remoteStreamsRef.current.set(peerId, stream)
    let el = audioElsRef.current.get(peerId)
    if (!el) {
      el = document.createElement('audio')
      el.autoplay = true
      el.playsInline = true
      audioElsRef.current.set(peerId, el)
    }
    el.srcObject = stream
    el.play().catch(() => {})
  }, [])

  const releaseRemoteAudio = useCallback((peerId) => {
    const el = audioElsRef.current.get(peerId)
    if (el) {
      el.srcObject = null
      audioElsRef.current.delete(peerId)
    }
    remoteStreamsRef.current.delete(peerId)
    metersRef.current.delete(peerId)
  }, [])

  const closePeer = useCallback((peerId) => {
    const pc = peersRef.current.get(peerId)
    if (pc) {
      try { pc.close() } catch {}
      peersRef.current.delete(peerId)
    }
    releaseRemoteAudio(peerId)
    setPeerState(peerId, null)
  }, [releaseRemoteAudio, setPeerState])

  const createPeer = useCallback((peerId, initiator) => {
    const existing = peersRef.current.get(peerId)
    if (existing) return existing
    const pc = new RTCPeerConnection(RTC_CONFIG)
    peersRef.current.set(peerId, pc)

    const stream = micStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    }

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        attachRemoteStream(peerId, e.streams[0])
        setPeerState(peerId, 'live')
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        relayRef.current(peerId, { kind: 'voice-ice', candidate: e.candidate })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        closePeer(peerId)
        // Initiator side retries once on failure by re-offering
        if (initiator && voiceOnRef.current) {
          setTimeout(() => {
            if (voiceOnRef.current) createPeer(peerId, true)
          }, 1500)
        }
      }
    }

    setPeerState(peerId, 'connecting')

    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          relayRef.current(peerId, { kind: 'voice-offer', sdp: pc.localDescription })
        } catch {}
      }
    }

    return pc
  }, [attachRemoteStream, setPeerState, closePeer])

  const stopVoice = useCallback(() => {
    for (const [peerId] of peersRef.current) closePeer(peerId)
    peersRef.current.clear()
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => { try { t.stop() } catch {} })
      micStreamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
      metersRef.current.clear()
    }
    setLevels({})
    setMuted(false)
    setVoiceOn(false)
    setVoiceStateRef.current(false)
  }, [closePeer])

  const startVoice = useCallback(async () => {
    setVoiceError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS, video: false })
      micStreamRef.current = stream
      try {
        audioCtxRef.current = new AudioContext()
      } catch {}
      setVoiceOn(true)
      setVoiceStateRef.current(true)
    } catch (err) {
      if (err?.name !== 'NotAllowedError') {
        setVoiceError(`Mic failed: ${err?.message || err?.name || 'unknown'}`)
      } else {
        setVoiceError('Microphone permission denied.')
      }
    }
  }, [])

  const toggleMute = useCallback(() => {
    const stream = micStreamRef.current
    if (!stream) return
    const track = stream.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMuted(!track.enabled)
  }, [])

  const voiceOnRemoteRef = useRef(new Set())
  voiceOnRemoteRef.current = new Set((voiceParticipants || []).filter((id) => id !== participantId))

  // Reconcile peers when voice roster or room roster changes
  const participantsRef = useRef(participants)
  participantsRef.current = participants
  useEffect(() => {
    if (!active || !voiceOn) {
      if (voiceOn) stopVoice()
      return
    }
    const myId = participantIdRef.current
    if (!myId) return
    const roomIds = new Set(participantsRef.current.map((p) => p.id))
    const wanted = [...voiceOnRemoteRef.current].filter((id) => roomIds.has(id) && id !== myId)

    // Ensure a peer per wanted voice participant
    wanted.forEach((peerId) => {
      if (!peersRef.current.has(peerId)) {
        createPeer(peerId, myId < peerId) // deterministic initiator, no glare
      }
    })

    // Close peers no longer wanted
    for (const [peerId] of peersRef.current) {
      if (!wanted.includes(peerId)) {
        closePeer(peerId)
      }
    }
  }, [active, voiceOn, voiceParticipants, participants, createPeer, closePeer, stopVoice])

  useEffect(() => {
    if (!active) return
    return onRelay(async (from, payload) => {
      if (!payload || typeof payload !== 'object') return
      const kind = payload.kind
      if (kind !== 'voice-offer' && kind !== 'voice-answer' && kind !== 'voice-ice') return

      // Passive side: create on incoming offer (never initiate for unknown peers)
      let pc = peersRef.current.get(from)
      if (!pc && kind === 'voice-offer' && voiceOnRef.current) {
        pc = createPeer(from, false)
      }
      if (!pc) return

      try {
        if (kind === 'voice-offer' && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          relayRef.current(from, { kind: 'voice-answer', sdp: pc.localDescription })
        } else if (kind === 'voice-answer' && payload.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        } else if (kind === 'voice-ice' && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        }
      } catch {}
    })
  }, [active, onRelay, createPeer])

  // Level metering loop (~5 Hz)
  useEffect(() => {
    if (!voiceOn) return
    const interval = setInterval(() => {
      const ctx = audioCtxRef.current
      if (!ctx) return
      const next = {}
      const localStream = micStreamRef.current
      if (localStream) {
        let meter = metersRef.current.get('__local__')
        if (!meter) {
          meter = measureLevel(localStream, ctx)
          metersRef.current.set('__local__', meter)
        }
        next[participantIdRef.current] = meter()
      }
      for (const [peerId, stream] of remoteStreamsRef.current) {
        let meter = metersRef.current.get(peerId)
        if (!meter) {
          meter = measureLevel(stream, ctx)
          metersRef.current.set(peerId, meter)
        }
        next[peerId] = meter()
      }
      setLevels(next)
    }, 200)
    return () => clearInterval(interval)
  }, [voiceOn])

  useEffect(() => () => stopVoice(), [stopVoice])

  return { voiceOn, voiceError, muted, peerStates, levels, startVoice, stopVoice, toggleMute }
}
