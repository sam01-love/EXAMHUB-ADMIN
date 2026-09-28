import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, Plus, Search, Pencil, Trash2, Upload, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { subjectMeta, subjectIds } from '../data/subjects'

export default function Questions() {
  const [params, setParams] = useSearchParams()
  const subject = params.get('subject') || ''
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('questions').select('*').order('created_at', { ascending: false }).limit(500)
    if (subject) q = q.eq('subject', subject)
    const { data, error: err } = await q
    if (err) setError(err.message + ' — have you run supabase.sql in your Supabase project?')
    else {
      setError('')
      setRows(data || [])
    }
    setLoading(false)
  }, [subject])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) => r.prompt.toLowerCase().includes(term))
  }, [rows, query])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return
    const { error: err } = await supabase.from('questions').delete().eq('id', id)
    if (err) return setError(err.message)
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice('')
    setError('')
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('File must contain a non-empty JSON array.')

      const records = parsed.map((item, i) => {
        const label = `Item ${i + 1}`
        if (!subjectIds.includes(item.subject)) throw new Error(`${label}: unknown subject "${item.subject}".`)
        if (!item.prompt || !item.explanation) throw new Error(`${label}: prompt and explanation are required.`)
        if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((o) => !String(o).trim()))
          throw new Error(`${label}: options must be an array of exactly 4 non-empty strings.`)
        if (![0, 1, 2, 3].includes(item.answer)) throw new Error(`${label}: answer must be 0, 1, 2 or 3.`)
        return {
          subject: item.subject,
          stream: item.stream || null,
          instruction: item.instruction || 'Question',
          prompt: item.prompt,
          options: item.options.map(String),
          answer: item.answer,
          explanation: item.explanation,
        }
      })

      const { error: err } = await supabase.from('questions').insert(records)
      if (err) throw err
      setNotice(`Imported ${records.length} question${records.length > 1 ? 's' : ''}.`)
      load()
    } catch (err) {
      setError(`Import failed: ${err.message}`)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Questions</h1>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold transition hover:border-primary"
          >
            <Upload size={16} className="mr-2" />
            Import JSON
          </button>
          <Link
            to="/admin/questions/new"
            className="flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            Add
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={subject}
          onChange={(e) => setParams(e.target.value ? { subject: e.target.value } : {})}
          className="min-h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All subjects</option>
          {subjectIds.map((id) => (
            <option key={id} value={id}>
              {subjectMeta[id].name}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search question text"
            className="min-h-11 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {notice && <p className="rounded-lg bg-tertiary/10 p-3 text-sm font-medium text-tertiary">{notice}</p>}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={26} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No questions found. Add one, or import a JSON file.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {subjectMeta[r.subject]?.short || r.subject}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.instruction}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{r.prompt}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Answer: <span className="font-semibold text-tertiary">{r.options[r.answer]}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  to={`/admin/questions/${r.id}/edit`}
                  aria-label="Edit question"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete question"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
