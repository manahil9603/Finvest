'use client'

import {
  createContext, useContext, useCallback,
  useState, useEffect, useRef,
  ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id:        string
  type:      ToastType
  title:     string
  message?:  string
  duration?: number  // ms, default 4000; 0 = persist
}

interface ToastCtx {
  toasts:      ToastItem[]
  addToast:    (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx>({
  toasts:      [],
  addToast:    () => '',
  removeToast: () => {},
})

export function useToastContext() {
  return useContext(ToastContext)
}

// ─── Provider  (placed in layout via Toaster) ─────────────────────────────────

let _addToast: ToastCtx['addToast'] = () => ''

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>): string => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  // Expose imperatively so non-component code can call toast()
  _addToast = addToast

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

// ─── Imperative API  (use anywhere, no hook needed) ──────────────────────────

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    _addToast({ type: 'success', title, message, duration }),
  error: (title: string, message?: string, duration?: number) =>
    _addToast({ type: 'error', title, message, duration }),
  warning: (title: string, message?: string, duration?: number) =>
    _addToast({ type: 'warning', title, message, duration }),
  info: (title: string, message?: string, duration?: number) =>
    _addToast({ type: 'info', title, message, duration }),
}

// ─── Individual toast ─────────────────────────────────────────────────────────

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
}

const typeStyles: Record<ToastType, { icon: string; bar: string }> = {
  success: { icon: 'text-brand-green',  bar: 'bg-brand-green' },
  error:   { icon: 'text-red-400',      bar: 'bg-red-500' },
  warning: { icon: 'text-amber-400',    bar: 'bg-amber-400' },
  info:    { icon: 'text-brand-blue',   bar: 'bg-brand-blue' },
}

function ToastCard({ toast: t, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const duration = t.duration ?? 4000

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(onRemove, 260)
  }, [onRemove])

  useEffect(() => {
    if (duration === 0) return
    timerRef.current = setTimeout(dismiss, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [dismiss, duration])

  const style = typeStyles[t.type]

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative w-full max-w-sm rounded-2xl overflow-hidden',
        'glass-strong shadow-glass',
        'transition-all duration-260',
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div
          className={cn('absolute top-0 left-0 h-0.5', style.bar)}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
            width: '100%',
          }}
        />
      )}

      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <span className={cn('shrink-0 mt-0.5', style.icon)}>
          {icons[t.type]}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{t.title}</p>
          {t.message && (
            <p className="text-xs text-fg-2 mt-0.5 leading-relaxed">{t.message}</p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          className="shrink-0 text-fg-3 hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-surface/20"
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// ─── Toaster  (rendered in layout.tsx) ───────────────────────────────────────

export function Toaster() {
  const { toasts, removeToast } = useToastContext()

  return (
    <div
      aria-label="Notifications"
      className={cn(
        'fixed z-[9999] flex flex-col gap-2 p-4',
        // Top-right on desktop, top-center on mobile
        'bottom-4 right-4',
        'sm:top-4 sm:bottom-auto sm:right-4',
        'w-full max-w-sm',
        'pointer-events-none'
      )}
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onRemove={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  )
}
