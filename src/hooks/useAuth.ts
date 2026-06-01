'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getRoleRedirect } from '@/lib/constants'
import type { User } from '@/types'

interface AuthState {
  user:            User | null
  loading:         boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState & {
  logout:      () => Promise<void>
  refetch:     () => Promise<void>
  redirectToDashboard: () => void
} {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user:            null,
    loading:         true,
    isAuthenticated: false,
  })

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const { data } = await res.json()
        setState({ user: data, loading: false, isAuthenticated: true })
      } else {
        setState({ user: null, loading: false, isAuthenticated: false })
      }
    } catch {
      setState({ user: null, loading: false, isAuthenticated: false })
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setState({ user: null, loading: false, isAuthenticated: false })
    router.push('/login')
    router.refresh()
  }, [router])

  const redirectToDashboard = useCallback(() => {
    if (state.user) {
      router.push(getRoleRedirect(state.user.role))
    }
  }, [state.user, router])

  return {
    ...state,
    logout,
    refetch:             fetchUser,
    redirectToDashboard,
  }
}
