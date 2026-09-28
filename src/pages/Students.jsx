import { useEffect, useMemo, useState } from 'react'
import { Loader2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Search, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { subjectMeta } from '../data/subjects'

export default function Students() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .from('exam_attempts')
      .select('id,user_id,user_email,stream,subjects,subject_scores,total_score,taken_at')
      .order('taken_at', { ascending: true })
      .limit(2000)
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message + ' — have you run supabase.sql in your Supabase project?')
        else setAttempts(data || [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const students = useMemo(() => {
    const map = new Map()
    for (const a of attempts) {
      const key = a.user_id || a.user_email || 'anonymous'
      if (!map.has(key)) map.set(key, { key, email: a.user_email || 'Anonymous', attempts: [] })
      map.get(key).attempts.push(a)
    }
    return [...map.values()]
      .map((s) => {
        const scores = s.attempts.map((a) => a.total_score)
        const avg = Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
        const best = Math.max(...scores)
        // Trend: latest attempt vs. the one before it
        const trend = scores.length > 1 ? scores[scores.length - 1] - scores[scores.length - 2] : null
        const last = s.attempts[s.attempts.length - 1].taken_at
        return { ...s, avg, best, trend, last }
      })
      .sort((a, b) => b.avg - a.avg)
  }, [attempts])

  const filtered = students.filter((s) => s.email.toLowerCase().includes(query.trim().toLowerCase()))

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Students</h1>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email"
          className="min-h-11 w-full rounded-lg border border-input bg-card pl-9 pr-4 text-sm outline-none focus:border-primary sm:max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No student results yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, rank) => {
            const open = openId === s.key
            return (
              <div key={s.key} className="rounded-2xl border border-border bg-card">
                <button onClick={() => setOpenId(open ? null : s.key)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                    {rank + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.attempts.length} attempt{s.attempts.length > 1 ? 's' : ''} · last {new Date(s.last).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Best</p>
                    <p className="font-heading font-bold">{s.best}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="font-heading font-bold text-primary">{s.avg}/400</p>
                  </div>
                  <span className="w-5 shrink-0">
                    {s.trend == null ? (
                      <Minus size={16} className="text-muted-foreground" />
                    ) : s.trend >= 0 ? (
                      <TrendingUp size={16} className="text-tertiary" />
                    ) : (
                      <TrendingDown size={16} className="text-destructive" />
                    )}
                  </span>
                  {open ? <ChevronUp size={16} className="shrink-0" /> : <ChevronDown size={16} className="shrink-0" />}
                </button>

                {open && (
                  <div className="space-y-2 border-t border-border p-4">
                    {[...s.attempts].reverse().map((a) => (
                      <div key={a.id} className="rounded-xl bg-muted p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold capitalize">{a.stream} stream</span>
                          <span className="font-heading font-bold">{a.total_score}/400</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(a.subject_scores || {}).map(([id, score]) => (
                            <span key={id} className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {subjectMeta[id]?.short || id}: {score}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">{new Date(a.taken_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
