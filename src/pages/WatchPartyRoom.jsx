import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PartySyncProvider, usePartySync } from '../context/PartySyncContext.jsx'
import { useWebRTCHost, useWebRTCViewer } from '../hooks/useWebRTCShare.js'
import { useVoiceChat } from '../hooks/useVoiceChat.js'
import { usePartyPlaybackSync } from '../hooks/usePartyPlaybackSync.js'
import { buildEmbedUrl } from '../data/providers.js'
import PartyDock from '../components/PartyDock.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import PeoplePanel from '../components/PeoplePanel.jsx'
import SearchPanel from '../components/SearchPanel.jsx'

function PartyRoomInitializer() {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { createRoom, joinRoom } = usePartySync()
  const joinCalled = useRef(false)

  const hostName = location.state?.hostName
  const memberName = location.state?.memberName
  const media = location.state?.media

  useEffect(() => {
    if (!code || joinCalled.current) return
    joinCalled.current = true

    if (hostName) {
      createRoom(code, hostName, media)
    } else if (memberName) {
      joinRoom(code, memberName)
    } else {
      navigate(`/party?code=${code}`, { replace: true })
    }
  }, [code, hostName, memberName, media, createRoom, joinRoom, navigate])

  return <PartyRoomContent />
}

function PartyRoomContent() {
  const navigate = useNavigate()
  const {
    connected,
    reconnecting,
    role,
    roomCode,
    partyMedia,
    participants,
    hostId,
    isHost,
    error,
    syncRequested,
    syncRequestId,
    lastEvent,
    sendPartyEvent,
    shareActive,
    requestSync,
    setRoomMedia,
    disconnect,
    clearError,
    participantId,
    sendShareSignal,
    relay,
    onRelay,
    chatMessages,
    sendChat,
    voiceParticipants,
    setVoiceState,
  } = usePartySync()

  const viewerVideoRef = useRef(null)

  const {
    sharing,
    shareError,
    quality,
    setQuality,
    startShare,
    stopShare,
    audioUnavailable,
    displaySurface,
    collectStats,
  } = useWebRTCHost({
    participantId,
    participants,
    relay,
    onRelay,
    sendShareSignal,
    active: connected && isHost,
  })

  const [shareStats, setShareStats] = useState([])
  const collectStatsRef = useRef(collectStats)
  collectStatsRef.current = collectStats

  useEffect(() => {
    if (!sharing || participants.length < 2) {
      setShareStats([])
      return
    }
    const poll = async () => {
      const stats = await collectStatsRef.current()
      setShareStats(stats)
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [sharing, participants.length])

  const { remoteStream, viewerError, requestQuality } = useWebRTCViewer({
    shareActive,
    hostId,
    relay,
    onRelay,
    active: connected && !isHost,
  })

  const voice = useVoiceChat({
    active: connected,
    participantId,
    participants,
    voiceParticipants,
    setVoiceState,
    relay,
    onRelay,
  })

  const [memberQuality, setMemberQuality] = useState('hd')
  const handleMemberQuality = useCallback((key) => {
    setMemberQuality(key)
    requestQuality(key)
  }, [requestQuality])

  const [activeTab, setActiveTab] = useState('chat')
  const [unreadChat, setUnreadChat] = useState(0)
  const chatSeenRef = useRef(0)

  useEffect(() => {
    if (activeTab === 'chat') {
      chatSeenRef.current = chatMessages.length
      setUnreadChat(0)
    } else {
      setUnreadChat(Math.max(0, chatMessages.length - chatSeenRef.current))
    }
  }, [chatMessages.length, activeTab])

  useEffect(() => {
    const video = viewerVideoRef.current
    if (video && remoteStream) {
      video.srcObject = remoteStream
      video.play().catch(() => {})
    }
  }, [remoteStream])

  const handleLeave = () => {
    disconnect()
    navigate('/party')
  }

  const playerUrl =
    partyMedia?.mediaType && partyMedia?.mediaId
      ? buildEmbedUrl('vidfast', partyMedia.mediaType, partyMedia.mediaId, partyMedia.season, partyMedia.episode)
      : null

  const iframeRef = useRef(null)
  const playback = usePartyPlaybackSync({
    iframeRef,
    playerUrl,
    connected,
    isHost,
    active: !shareActive,
    lastEvent,
    sendPartyEvent,
    syncRequestId,
  })

  if (!connected && !reconnecting && !partyMedia) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink text-mist">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-brand" />
        <p className="text-sm">Connecting to party...</p>
      </div>
    )
  }

  const memberViewingShare = !isHost && shareActive

  const tabs = [
    { key: 'chat', label: 'Chat', badge: unreadChat > 0 ? unreadChat : null },
    { key: 'people', label: 'People' },
    ...(isHost ? [{ key: 'search', label: 'Search' }] : []),
  ]

  return (
    <div className="flex h-screen flex-col bg-ink">
      <div className="flex min-h-12 items-center justify-between border-b border-white/10 bg-ink px-4 pt-14">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-1 text-xs font-bold text-cream/80 transition-colors hover:text-white"
          >
            &larr; Leave Party
          </button>
          {partyMedia && (
            <>
              <span className="mx-1 text-mist">·</span>
              <span className="text-xs font-bold text-white">{partyMedia.title}</span>
              {partyMedia.season && (
                <span className="text-xs text-mist">
                  S{partyMedia.season} E{partyMedia.episode}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reconnecting && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400">
              Reconnecting
            </span>
          )}
          {shareActive && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-red-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              Live
            </span>
          )}
          {!isHost && role === 'member' && !shareActive && (
            <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-brand">
              Watching as member
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-4 py-2">
          <p className="text-xs font-bold text-red-400">{error}</p>
          <button onClick={clearError} className="text-red-400 transition-colors hover:text-white">&times;</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left column: video fills available space, dock sits compact below */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-black">
            {memberViewingShare ? (
              remoteStream ? (
                <video
                  ref={viewerVideoRef}
                  className="h-full w-full"
                  autoPlay
                  playsInline
                  controls
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-mist">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
                  <p className="text-sm font-bold">Connecting to host stream...</p>
                  {viewerError && <p className="text-xs text-red-400">{viewerError}</p>}
                </div>
              )
            ) : playerUrl ? (
              <iframe
                ref={iframeRef}
                key={playerUrl}
                src={playerUrl}
                title={partyMedia?.title || 'Party player'}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{
                  pointerEvents:
                    isHost || playback.status === 'blocked' ? 'auto' : 'none',
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-mist">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
                <p className="text-sm">Loading player...</p>
              </div>
            )}

            {isHost && sharing && (
              <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white">
                  Sharing to {Math.max(0, participants.length - 1)} member{participants.length - 1 === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {!isHost && !shareActive && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
                <div className="rounded-full bg-black/60 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-mist backdrop-blur">
                  {playback.status === 'blocked' && (
                    <span className="text-amber-400">Tap play once — sync takes over</span>
                  )}
                  {playback.status === 'unavailable' && (
                    <span>Sync unavailable — host can screen-share instead</span>
                  )}
                  {playback.status === 'syncing' && <span>Syncing with host…</span>}
                  {playback.status === 'synced' && (
                    <span className="text-emerald-400">In sync · host controls playback</span>
                  )}
                  {(playback.status === 'idle' || playback.status === 'host') && (
                    <span>Host controls playback</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {isHost && sharing && (
            <div className="shrink-0 px-4 py-2">
              <p className="text-[10px] font-bold text-mist">
                Tip: keep your movie tab fully visible for the cleanest stream. Members see exactly what you see.
              </p>
            </div>
          )}

          <PartyDock
            roomCode={roomCode}
            isHost={isHost}
            syncRequested={syncRequested}
            sharing={sharing}
            shareError={shareError}
            audioUnavailable={audioUnavailable}
            displaySurface={displaySurface}
            shareStats={shareStats}
            quality={quality}
            onSetQuality={setQuality}
            onStartShare={startShare}
            onStopShare={stopShare}
            onRequestSync={requestSync}
            memberQuality={memberQuality}
            onRequestQuality={handleMemberQuality}
            shareActive={shareActive}
          />
        </div>

        {/* Right rail: tabs */}
        <aside className="hidden w-80 shrink-0 flex-col border-l border-white/10 bg-ink lg:flex">
          <div className="flex border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  activeTab === tab.key ? 'bg-white/5 text-white' : 'text-mist hover:text-white'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="absolute right-2 top-2 min-w-4 rounded-full bg-brand px-1 text-center text-[8px] font-black leading-4 text-white">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />
                )}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <ChatPanel
                chatMessages={chatMessages}
                participantId={participantId}
                onSendChat={sendChat}
                voice={voice}
                participants={participants}
                hostId={hostId}
              />
            )}
            {activeTab === 'people' && (
              <PeoplePanel
                participants={participants}
                hostId={hostId}
                participantId={participantId}
                voiceParticipants={voiceParticipants}
                onLeave={handleLeave}
              />
            )}
            {activeTab === 'search' && isHost && (
              <SearchPanel onChangeMedia={setRoomMedia} />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function WatchPartyRoom() {
  return (
    <PartySyncProvider>
      <PartyRoomInitializer />
    </PartySyncProvider>
  )
}
