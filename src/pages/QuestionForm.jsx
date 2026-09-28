import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { subjectMeta, subjectIds, streams } from '../data/subjects'

const empty = {
  subject: 'mathematics',
  stream: '',
  instruction: '',
  prompt: '',
  options: ['', '', '', ''],
  answer: 0,
  explanation: '',
}

export default function QuestionForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let active = true
    supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message)
        else setForm({ ...data, stream: data.stream || '' })
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, isEdit])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const setOption = (i, value) =>
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? value : o)) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.options.some((o) => !o.trim())) return setError('All four options are required.')
    if (new Set(form.options.map((o) => o.trim())).size !== 4) return setError('Options must be different from each other.')

    setSaving(true)
    const record = {
      subject: form.subject,
      stream: form.stream || null,
      instruction: form.instruction.trim() || 'Question',
      prompt: form.prompt.trim(),
      options: form.options.map((o) => o.trim()),
      answer: form.answer,
      explanation: form.explanation.trim(),
    }
    const { error: err } = isEdit
      ? await supabase.from('questions').update(record).eq('id', id)
      : await supabase.from('questions').insert(record)
    setSaving(false)

    if (err) return setError(err.message)
    navigate(`/admin/questions?subject=${record.subject}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={26} />
      </div>
    )
  }

  const field = 'min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary'

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link to="/admin/questions" className="mb-4 inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowLeft size={16} className="mr-1" />
        Back to questions
      </Link>
      <h1 className="font-heading text-xl font-bold sm:text-2xl">{isEdit ? 'Edit question' : 'Add question'}</h1>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Subject
            <select value={form.subject} onChange={(e) => set('subject', e.target.value)} className={`${field} mt-1.5`}>
              {subjectIds.map((sid) => (
                <option key={sid} value={sid}>
                  {subjectMeta[sid].name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Stream tag <span className="font-normal text-muted-foreground">(optional)</span>
            <select value={form.stream} onChange={(e) => set('stream', e.target.value)} className={`${field} mt-1.5`}>
              <option value="">None</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Topic / instruction <span className="font-normal text-muted-foreground">(optional)</span>
          <input
            value={form.instruction}
            onChange={(e) => set('instruction', e.target.value)}
            placeholder="e.g. Number bases"
            className={`${field} mt-1.5`}
          />
        </label>

        <label className="block text-sm font-semibold">
          Question
          <textarea
            required
            rows={3}
            value={form.prompt}
            onChange={(e) => set('prompt', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">Options — select the correct one</legend>
          <div className="mt-2 space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="answer"
                  checked={form.answer === i}
                  onChange={() => set('answer', i)}
                  aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                  className="h-4 w-4 shrink-0 accent-[var(--tertiary)]"
                />
                <span className="w-5 shrink-0 text-sm font-bold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                <input required value={opt} onChange={(e) => setOption(i, e.target.value)} className={field} />
              </div>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-semibold">
          Explanation
          <textarea
            required
            rows={3}
            value={form.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-input bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </label>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : isEdit ? 'Save changes' : 'Add question'}
        </button>
      </form>
    </div>
  )
}
