import { Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function TopBar({ onMenuClick }) {
  const { user, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initial = (user?.email || 'A')[0].toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:block">{user?.email}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
          {initial}
        </span>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
