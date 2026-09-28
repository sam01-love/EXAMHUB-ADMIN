import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function ProtectedAdminRoute() {
  const { user, isAdmin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (!user || !isAdmin) return <Navigate to="/login" replace />
  return <Outlet />
}
