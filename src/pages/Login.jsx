import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { user, isAdmin, loading, signIn, signOut } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { admin } = await signIn({ email, password })
      if (!admin) {
        await signOut()
        setError('This account does not have admin access.')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err.message || 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo to="/login" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-theme sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <ShieldCheck size={20} />
            </span>
            <h1 className="font-heading text-lg font-bold">Admin sign in</h1>
          </div>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="min-h-11 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="min-h-11 w-full rounded-lg border border-input bg-background px-4 text-sm outline-none focus:border-primary"
          />

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
