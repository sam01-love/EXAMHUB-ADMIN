import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ClipboardList, Users, Gauge, Trophy, FileQuestion, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { subjectMeta, subjectIds, subjectQuestionCount } from '../data/subjects'

const PASS_MARK = 200 // 50% of 400

function bucketOf(score) {
  if (score < 100) return 0
  if (score < 200) return 1
  if (score < 300) return 2
  return 3
}
const bucketLabels = ['0–99', '100–199', '200–299', '300–400']

export default function Dashboard() {
  const [attempts, setAttempts] = useState([])
  const [questionCounts, setQuestionCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const [attemptsRes, questionsRes] = await Promise.all([
        supabase
          .from('exam_attempts')
          .select('id,user_id,user_email,stream,subjects,subject_scores,total_score,taken_at')
          .order('taken_at', { ascending: false })
          .limit(1000),
        supabase.from('questions').select('subject'),
      ])
      if (!active) return

      if (attemptsRes.error || questionsRes.error) {
        setError(
          (attemptsRes.error || questionsRes.error).message +
            ' — have you run supabase.sql in your Supabase project?'
        )
      } else {
        setAttempts(attemptsRes.data || [])
        const counts = {}
        for (const row of questionsRes.data || []) counts[row.subject] = (counts[row.subject] || 0) + 1
        setQuestionCounts(counts)
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    if (!attempts.length) return null
    const students = new Set(attempts.map((a) => a.user_id || a.user_email || a.id))
    const avg = Math.round(attempts.reduce((s, a) => s + a.total_score, 0) / attempts.length)
    const passRate = Math.round((attempts.filter((a) => a.total_score >= PASS_MARK).length / attempts.length) * 100)

    const sums = {}
    const counts = {}
    for (const a of attempts) {
      for (const [id, score] of Object.entries(a.subject_scores || {})) {
        sums[id] = (sums[id] || 0) + score
        counts[id] = (counts[id] || 0) + 1
      }
    }
    const perSubject = Object.keys(sums)
      .map((id) => ({ id, avg: Math.round(sums[id] / counts[id]), n: counts[id] }))
      .sort((a, b) => a.avg - b.avg)

    const distribution = [0, 0, 0, 0]
    for (const a of attempts) distribution[bucketOf(a.total_score)]++

    return { students: students.size, avg, passRate, perSubject, distribution }
  }, [attempts])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  const maxBucket = stats ? Math.max(...stats.distribution, 1) : 1

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Overview</h1>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Exam attempts" value={stats ? attempts.length : 0} />
        <StatCard icon={Users} label="Active students" value={stats ? stats.students : 0} />
        <StatCard icon={Gauge} label="Average score" value={stats ? `${stats.avg}/400` : '—'} />
        <StatCard icon={Trophy} label={`Pass rate (${PASS_MARK}+)`} value={stats ? `${stats.passRate}%` : '—'} />
      </div>

      {!stats ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <ClipboardList size={32} className="mx-auto text-muted-foreground" />
          <p className="mt-3 font-heading font-bold">No exam attempts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Results appear here as students finish Exam Mode in the student app.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Per-subject averages (weakest first) */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-base font-bold">Average by subject</h2>
            <p className="text-xs text-muted-foreground">Weakest first, score out of 100</p>
            <div className="mt-5 space-y-4">
              {stats.perSubject.map((s) => (
                <div key={s.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{subjectMeta[s.id]?.name || s.id}</span>
                    <b className={s.avg < 50 ? 'text-destructive' : 'text-primary'}>{s.avg}</b>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${s.avg < 50 ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${s.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Score distribution */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-heading text-base font-bold">Score distribution</h2>
            <p className="text-xs text-muted-foreground">Attempts per score band (out of 400)</p>
            <div className="mt-6 flex h-40 items-end justify-between gap-3">
              {stats.distribution.map((count, i) => (
                <div key={bucketLabels[i]} className="flex h-full w-full flex-col items-center justify-end gap-2">
                  <span className="text-xs font-bold">{count}</span>
                  <div
                    className="w-full rounded-t-lg bg-primary/80"
                    style={{ height: `${(count / maxBucket) * 100}%`, minHeight: count ? 4 : 0 }}
                  />
                  <span className="text-[11px] text-muted-foreground">{bucketLabels[i]}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Question bank coverage */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <FileQuestion size={16} />
            </span>
            <h2 className="font-heading text-base font-bold">Question bank coverage</h2>
          </div>
          <Link to="/admin/questions/new" className="text-sm font-semibold text-primary">
            Add question
          </Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Subjects with no admin-added questions fall back to the student app's built-in bank.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {subjectIds.map((id) => {
            const have = questionCounts[id] || 0
            const target = subjectQuestionCount(id)
            return (
              <Link
                key={id}
                to={`/admin/questions?subject=${id}`}
                className="rounded-xl bg-muted p-3 transition hover:ring-2 hover:ring-primary/30"
              >
                <p className="text-xs font-semibold text-muted-foreground">{subjectMeta[id].short}</p>
                <p className="mt-1 font-heading text-lg font-bold">
                  {have}
                  <span className="text-xs font-medium text-muted-foreground"> / {target}</span>
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon size={19} />
      </span>
      <p className="mt-3 font-heading text-xl font-bold sm:text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
