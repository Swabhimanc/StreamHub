import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function JoinPartyModal({ onClose, onJoin }) {
  const [searchParams] = useSearchParams()
  const prefillCode = searchParams.get('code') || ''
  const [code, setCode] = useState(prefillCode.toUpperCase())
  const [name, setName] = useState('')

  useEffect(() => {
    if (prefillCode) setCode(prefillCode.toUpperCase())
  }, [prefillCode])

  const handleJoin = () => {
    if (!code.trim() || !name.trim()) return
    onJoin({ code: code.trim().toUpperCase(), name: name.trim() })
  }

  const canJoin = code.trim().length >= 4 && name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl shadow-black/60">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-mist transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <h2 className="mb-2 text-xl font-black text-white">Join a Party</h2>
        <p className="mb-5 text-sm text-mist">Enter the party code and your name to join.</p>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">
            Party code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="e.g. A3B9X2"
            maxLength={6}
            className="w-full rounded-lg border border-white/15 bg-surface px-4 py-3 text-center text-lg font-black tracking-[0.3em] text-white outline-none uppercase placeholder:tracking-[0.2em] placeholder:text-mist/30 focus:border-brand"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-mist">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            className="w-full rounded-lg border border-white/15 bg-surface px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-mist/50 focus:border-brand"
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={!canJoin}
          className="w-full rounded-lg bg-white py-3.5 text-sm font-black text-black transition-all hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
        >
          Join Party
        </button>
      </div>
    </div>
  )
}
