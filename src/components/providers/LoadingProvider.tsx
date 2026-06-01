'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'

const SCROLL_LOCK_CLASS = 'finvest-scroll-lock'

function releaseScrollLock() {
  document.body.classList.remove(SCROLL_LOCK_CLASS)
  document.body.style.overflow = ''
  document.documentElement.style.overflow = ''
}

interface LoadingContextValue {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

function NavigationLoadingListener({
  startLoading,
  stopLoading,
}: {
  startLoading: () => void
  stopLoading: () => void
}) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    pathnameRef.current = pathname
    if (pendingRef.current) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    stopLoading()
    releaseScrollLock()
  }, [pathname, stopLoading])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as Element).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (anchor.hasAttribute('download')) return

      const target = anchor.getAttribute('target')
      if (target && target !== '_self') return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const nextPath = url.pathname + url.search
      const currentPath = pathnameRef.current + window.location.search
      if (nextPath === currentPath) return

      if (pendingRef.current) clearTimeout(pendingRef.current)
      pendingRef.current = setTimeout(() => {
        pendingRef.current = null
        startLoading()
      }, 120)
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (pendingRef.current) clearTimeout(pendingRef.current)
    }
  }, [startLoading])

  return null
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false)
  const countRef = useRef(0)

  const startLoading = useCallback(() => {
    countRef.current += 1
    setVisible(true)
  }, [])

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    if (countRef.current === 0) {
      setVisible(false)
      releaseScrollLock()
    }
  }, [])

  const value = useMemo(
    () => ({ isLoading: visible, startLoading, stopLoading }),
    [visible, startLoading, stopLoading],
  )

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay active={visible} />
      <NavigationLoadingListener startLoading={startLoading} stopLoading={stopLoading} />
    </LoadingContext.Provider>
  )
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext)
  if (!ctx) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return ctx
}
