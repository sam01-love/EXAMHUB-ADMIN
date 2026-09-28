import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function Settings() {
  const { user, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Settings</h1>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <Mail size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="truncate text-sm font-semibold">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
            <ShieldCheck size={18} />
          </span>
          <p className="text-sm font-semibold">Administrator access</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="flex min-h-11 w-full items-center justify-center rounded-lg border border-destructive/30 bg-card font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <LogOut size={18} className="mr-2" />
        Sign out
      </button>
    </div>
  )
}
