import { useEffect, useState } from 'react'
import { useApiKey } from '../context/ApiKeyContext.jsx'
import { useMyList } from '../context/MyListContext.jsx'
import { validateTmdbApiKey } from '../api/tmdb.js'
import { SpinnerIcon } from '../components/icons.jsx'
import MovieCard from '../components/MovieCard.jsx'

export default function SettingsPage() {
  const { apiKey, updateApiKey, hasApiKey } = useApiKey()
  const { items } = useMyList()
  const [draft, setDraft] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => { setDraft(apiKey) }, [apiKey])

  const saveKey = async () => {
    const nextKey = draft.trim()
    if (!nextKey) {
      setMessage({ type: 'error', text: 'Enter a TMDB API key before saving.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const valid = await validateTmdbApiKey(nextKey)
      if (!valid) {
        setMessage({ type: 'error', text: 'TMDB rejected this API key. Check it and try again.' })
        return
      }

      updateApiKey(nextKey)
      setMessage({ type: 'success', text: 'API key saved. The catalog is refreshing.' })
    } catch {
      setMessage({ type: 'error', text: 'Could not verify the key. Check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  const removeKey = () => {
    updateApiKey('')
    setDraft('')
    setMessage({ type: 'success', text: 'API key removed. Add your own key to restore the live catalog.' })
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-brand">StreamBox</p>
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Settings</h1>
      <p className="mt-1.5 text-sm text-mist">Manage your catalog connection and saved titles.</p>

      {/* API Key Card */}
      <div className="mt-6 rounded-2xl border border-white/12 bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-white">TMDB API Key</h2>
            <p className="mt-0.5 text-xs text-mist">Used for movie and series metadata</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[8px] font-black uppercase tracking-wider ${
              hasApiKey
                ? 'border-emerald-400/28 bg-emerald-400/8 text-cream'
                : 'border-white/12 bg-surface-light text-cream'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-mist'}`}
            />
            {hasApiKey ? 'Connected' : 'Not Set'}
          </span>
        </div>

        <label className="mt-5 block text-[10px] font-black uppercase tracking-[0.16em] text-mist">
          API Key
        </label>
        <div className="mt-2 flex overflow-hidden rounded-lg border border-white/12 bg-[#0d0d0d]">
          <input
            type={showKey ? 'text' : 'password'}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setMessage(null) }}
            placeholder="Enter your TMDB v3 API key"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            className="min-h-[48px] flex-1 px-3.5 text-sm text-white outline-none placeholder:text-mist"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="w-[60px] border-l border-white/12 text-[9px] font-black uppercase tracking-wider text-cream transition hover:bg-white/5"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-mist">
          Your key is stored only in this browser and sent directly to TMDB.
        </p>

        {message && (
          <p
            className={`mt-2.5 text-xs leading-relaxed ${
              message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={saveKey}
            disabled={saving}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-black text-white transition hover:bg-brand-hover disabled:opacity-55"
          >
            {saving && <SpinnerIcon className="h-4 w-4" />}
            {saving ? 'Verifying...' : 'Save API Key'}
          </button>
          {hasApiKey && (
            <button
              onClick={removeKey}
              disabled={saving}
              className="inline-flex min-h-[44px] min-w-[82px] items-center justify-center rounded-lg bg-surface-light text-sm font-extrabold text-cream transition hover:bg-white/10 disabled:opacity-55"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* My List section */}
      <div className="mt-8 border-t border-white/8 pt-6">
        <div className="mb-4">
          <h2 className="text-xl font-black text-white sm:text-2xl">My List</h2>
          <p className="mt-1 text-xs text-mist">
            {items.length} saved title{items.length === 1 ? '' : 's'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-white/12 px-6 py-8 text-center">
            <p className="text-base font-extrabold text-cream">Nothing saved yet</p>
            <p className="mt-1.5 max-w-sm text-xs text-mist">
              Use the + button on any title to keep it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <MovieCard key={item.key} media={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
