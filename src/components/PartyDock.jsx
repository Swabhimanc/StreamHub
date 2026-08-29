import { useState } from 'react'

const SURFACE_LABELS = {
  browser: 'Tab',
  window: 'Window',
  monitor: 'Screen',
  application: 'App',
}

export default function PartyDock({
  roomCode,
  isHost,
  syncRequested,
  sharing,
  shareError,
  audioUnavailable,
  displaySurface,
  shareStats,
  quality,
  onSetQuality,
  onStartShare,
  onStopShare,
  onRequestSync,
  memberQuality,
  onRequestQuality,
  shareActive,
}) {
  const [copied, setCopied] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  const copyLink = async () => {
    const url = new URL(window.location)
    url.pathname = `/party/${roomCode}`
    try {
      await navigator.clipboard.writeText(url.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div className="shrink-0 border-t border-white/10 bg-ink">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Party code */}
        <section className="rounded-xl border border-white/10 bg-white/3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Party Code</p>
            <button
              onClick={copyLink}
              className="rounded-lg border border-white/15 bg-surface px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="mt-1 text-2xl font-black tracking-wider text-white">{roomCode}</p>
          <p className="mt-1 text-[11px] text-mist">Share this code — or copy the link — to invite friends in.</p>
        </section>

        {/* Host controls */}
        {isHost && (
          <section className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Watch Together</p>
            {!sharing ? (
              <>
                <p className="mt-2 text-[11px] leading-snug text-mist">
                  Share your screen/tab with the video to stream it live to every member — perfect sync, no player hacks.
                </p>
                <p className="mt-2 rounded bg-white/5 px-2 py-1.5 text-[9px] font-bold leading-snug text-mist/80">
                  Chrome/Edge: pick the video's <span className="text-white">Tab</span> (best audio). Brave: pick the
                  video's <span className="text-white">Window</span>.
                </p>
                <button
                  onClick={onStartShare}
                  className="mt-3 w-full rounded-lg bg-brand px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
                >
                  Start Screen Share
                </button>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Sharing live</span>
                  {displaySurface && (
                    <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-mist">
                      {SURFACE_LABELS[displaySurface] || displaySurface}
                    </span>
                  )}
                </div>
                {audioUnavailable && (
                  <p className="mt-2 rounded bg-amber-500/10 px-2 py-1.5 text-[9px] font-bold leading-snug text-amber-400">
                    Video-only share — this browser can't capture tab/window audio.
                  </p>
                )}
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mist">Stream Quality</p>
                  <div className="mt-2 flex gap-1.5">
                    {['light', 'balanced', 'hd'].map((key) => (
                      <button
                        key={key}
                        onClick={() => onSetQuality?.(key)}
                        className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                          quality === key
                            ? 'border-brand bg-brand/20 text-brand'
                            : 'border-white/15 bg-surface text-mist hover:bg-white/10'
                        }`}
                      >
                        {key === 'hd' ? 'HD' : key}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onStopShare}
                  className="mt-3 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20"
                >
                  Stop Sharing
                </button>
                {shareStats?.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setStatsOpen((o) => !o)}
                      className="w-full text-left text-[9px] font-black uppercase tracking-wider text-mist transition-colors hover:text-white"
                    >
                      Stream stats {statsOpen ? '▾' : '▸'}
                    </button>
                    {statsOpen && (
                      <div className="mt-1.5 space-y-1 rounded-lg bg-white/4 px-2.5 py-2">
                        {shareStats.map((s) => (
                          <div key={s.peerId} className="flex items-center justify-between text-[9px] font-bold text-mist">
                            <span>{shortId(s.peerId)}</span>
                            <span className="text-white">
                              {s.fps ? `${Math.round(s.fps)}fps` : '—'}{' '}
                              {s.mbps ? `· ${s.mbps.toFixed(1)}Mb/s` : ''}
                              {s.codec ? ` · ${s.codec}` : ''}
                              {s.packetsLost > 0 ? ` · ⚠${s.packetsLost}lost` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {shareError && (
              <p className="mt-2 text-[10px] font-bold text-red-400">{shareError}</p>
            )}
          </section>
        )}

        {/* Member controls */}
        {!isHost && (
          <section className="rounded-xl border border-white/10 bg-white/3 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mist">My Stream Quality</p>
            <div className="mt-2 flex gap-1.5">
              {['light', 'balanced', 'hd'].map((key) => (
                <button
                  key={key}
                  onClick={() => onRequestQuality?.(key)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    memberQuality === key
                      ? 'border-brand bg-brand/20 text-brand'
                      : 'border-white/15 bg-surface text-mist hover:bg-white/10'
                  }`}
                >
                  {key === 'hd' ? 'HD' : key}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[9px] leading-snug text-mist/70">
              Applies to your stream only — the host re-encodes your copy at this bitrate.
            </p>
            {!shareActive && (
              <button
                onClick={onRequestSync}
                disabled={syncRequested}
                className="mt-3 w-full rounded-lg border border-white/15 bg-surface px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {syncRequested ? 'Requesting sync...' : 'Request Sync'}
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function shortId(id) {
  return id?.slice(0, 4) || '?'
}
