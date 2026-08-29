import { useEffect, useRef, useState } from 'react'

export default function ChatPanel({
  chatMessages,
  participantId,
  onSendChat,
  voice: { voiceOn, voiceError, startVoice, stopVoice },
  hostId,
}) {
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chatMessages.length])

  const send = () => {
    if (!draft.trim()) return
    onSendChat(draft)
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Voice bar */}
      <div className="border-b border-white/10 px-3 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={voiceOn ? stopVoice : startVoice}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
              voiceOn
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                : 'border-white/15 bg-surface text-mist hover:bg-white/10 hover:text-white'
            }`}
            title={voiceOn ? 'Turn microphone off' : 'Turn microphone on'}
            aria-label={voiceOn ? 'Turn microphone off' : 'Turn microphone on'}
          >
            {voiceOn ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-white">
              {voiceOn ? 'Microphone on' : 'Microphone off'}
            </p>
            <p className="text-[9px] text-mist">
              {voiceOn ? 'Tap to hang up — others can hear you.' : 'Tap to talk with the room.'}
            </p>
          </div>
        </div>
        {voiceError && (
          <p className="mt-2 text-[10px] font-bold text-red-400">{voiceError}</p>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {chatMessages.length === 0 && (
          <p className="mt-6 text-center text-[11px] text-mist">No messages yet — say hi.</p>
        )}
        {chatMessages.map((msg) => {
          const mine = msg.fromParticipantId === participantId
          return (
            <div key={msg.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-mist">
                  {mine ? 'You' : msg.fromName}
                  {msg.fromParticipantId === hostId && ' · host'}
                </span>
                <span className="text-[8px] text-mist/70">{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`mt-0.5 max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-snug ${
                  mine ? 'bg-brand/20 text-white' : 'bg-white/7 text-cream'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message the room..."
            maxLength={500}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-surface px-3 py-2 text-xs font-semibold text-white outline-none placeholder:text-mist/50 focus:border-brand"
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function MicIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  )
}

function MicOffIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
