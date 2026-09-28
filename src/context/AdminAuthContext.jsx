import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AdminAuthContext = createContext(undefined)

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const checkAdmin = async (currentUser) => {
    if (!currentUser?.email) {
      setIsAdmin(false)
      return false
    }
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', currentUser.email)
        .maybeSingle()
      if (error) throw error
      const admin = Boolean(data)
      setIsAdmin(admin)
      return admin
    } catch (err) {
      console.warn('[EXAMHUB ADMIN] Could not verify admin status:', err.message)
      setIsAdmin(false)
      return false
    }
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      const currentUser = data.session?.user ?? null
      setUser(currentUser)
      await checkAdmin(currentUser)
      if (isMounted) setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await checkAdmin(currentUser)
      setLoading(false)
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    setAuthError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
    const admin = await checkAdmin(data.user)
    return { data, admin }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }

  const value = { user, isAdmin, loading, authError, signIn, signOut }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (ctx === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return ctx
}
