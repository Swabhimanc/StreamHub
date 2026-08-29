export default function PeoplePanel({ participants, hostId, participantId, voiceParticipants, onLeave }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1.5 overflow-y-auto p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mist">
          {participants.length} participant{participants.length === 1 ? '' : 's'}
        </p>
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white/4 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-light text-xs font-black text-white">
              {p.id === hostId ? '👑' : p.name[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm font-bold text-white">{p.name}</span>
            {voiceParticipants.includes(p.id) && (
              <span className="text-emerald-400" title="Voice connected">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3" />
                </svg>
              </span>
            )}
            {p.id === hostId && (
              <span className="ml-auto rounded bg-brand/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand">Host</span>
            )}
            {p.id === participantId && p.id !== hostId && (
              <span className="ml-auto rounded bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">You</span>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-4">
        <button
          onClick={onLeave}
          className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/20"
        >
          Leave Party
        </button>
      </div>
    </div>
  )
}
