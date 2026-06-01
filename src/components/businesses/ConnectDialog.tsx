'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ConnectionStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
type UserRole         = 'BUSINESS_OWNER' | 'INVESTOR' | 'BUYER' | 'ADMIN' | null

interface ConnectDialogProps {
  businessId:    string
  businessTitle: string
  ownerName:     string
  ownerId:       string
  listingType:   string
  currentUserId: string | null
  currentRole:   UserRole
  initialStatus: ConnectionStatus
}

// ─────────────────────────────────────────────────────────────
// Button states
// ─────────────────────────────────────────────────────────────

const STATUS_UI: Record<
  ConnectionStatus,
  { label: string; icon: string; style: React.CSSProperties; disabled?: boolean }
> = {
  NONE: {
    label: 'Send Connection Request',
    icon: '🤝',
    style: {
      background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
      boxShadow: '0 4px 20px rgba(107,33,168,0.45)',
      color: '#fff',
    },
  },
  PENDING: {
    label: 'Request Pending…',
    icon: '⏳',
    disabled: true,
    style: {
      background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.3)',
      color: '#FCD34D',
    },
  },
  ACCEPTED: {
    label: 'Connected ✅',
    icon: '✅',
    disabled: true,
    style: {
      background: 'rgba(16,185,129,0.12)',
      border: '1px solid rgba(16,185,129,0.3)',
      color: '#34D399',
    },
  },
  REJECTED: {
    label: 'Send New Request',
    icon: '🔄',
    style: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.15)',
      color: 'rgba(255,255,255,0.7)',
    },
  },
}

const MIN_MESSAGE = 30
const MAX_MESSAGE = 1000

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function ConnectDialog({
  businessId,
  businessTitle,
  ownerName,
  ownerId,
  listingType,
  currentUserId,
  currentRole,
  initialStatus,
}: ConnectDialogProps) {
  const router = useRouter()
  const { success, error: showError, info } = useToast()

  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState<ConnectionStatus>(initialStatus)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus textarea when dialog opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 150)
  }, [open])

  // ── Gate checks ─────────────────────────────────────────────

  const isOwn      = currentUserId === ownerId
  const canConnect = currentRole === 'INVESTOR' || currentRole === 'BUYER'

  const handleButtonClick = () => {
    if (!currentUserId) {
      info('Sign in required', 'Create a free account to connect with business owners.')
      router.push('/login')
      return
    }
    if (isOwn) return   // shouldn't be visible, but guard anyway
    if (!canConnect) {
      info('Investor or buyer account required', 'Only investors and buyers can send connection requests.')
      return
    }
    setOpen(true)
  }

  // ── Submit ──────────────────────────────────────────────────

  const submit = async () => {
    if (message.trim().length < MIN_MESSAGE) return
    setLoading(true)
    try {
      const connectionType =
        listingType === 'ACQUISITION' ? 'BUYING' : 'INVESTMENT'

      const res  = await fetch('/api/connections', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ businessId, message: message.trim(), type: connectionType }),
      })
      const data = await res.json()

      if (res.status === 409) {
        setStatus(data.existing?.status ?? 'PENDING')
        setOpen(false)
        info('Already sent', data.error)
        return
      }
      if (!res.ok) { showError('Failed', data.error); return }

      setStatus('PENDING')
      setOpen(false)
      setMessage('')
      success('Request sent!', `Your connection request was sent to ${ownerName}.`)
    } catch {
      showError('Network error', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────

  // Owner sees nothing (or a "this is your listing" note)
  if (isOwn) {
    return (
      <div className="w-full text-center py-3 rounded-2xl text-sm text-fg-3"
           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        🏢 This is your listing
      </div>
    )
  }

  if (currentUserId && !canConnect) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm cursor-not-allowed"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.45)',
        }}
        title="Only investors and buyers can send connection requests."
      >
        <span>Investor or Buyer Account Required</span>
      </button>
    )
  }

  const ui = STATUS_UI[status]

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────── */}
      <button
        onClick={handleButtonClick}
        disabled={ui.disabled || loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80 disabled:translate-y-0"
        style={ui.style}
      >
        <span>{ui.icon}</span>
        <span>{ui.label}</span>
      </button>

      {/* ── Modal overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          >
            {/* ── Dialog panel ──────────────────────────────── */}
            <motion.div
              key="dialog"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden"
              style={{
                background:          'rgba(20,20,24,0.98)',
                backdropFilter:      'blur(32px)',
                border:              '1px solid rgba(255,255,255,0.12)',
                boxShadow:           '0 24px 80px rgba(0,0,0,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="connect-dialog-title"
            >
              {/* Gradient top stripe */}
              <div className="h-1" style={{ background: 'linear-gradient(90deg, #6B21A8, #8B5CF6, #10B981)' }} />

              <div className="p-7">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 id="connect-dialog-title" className="font-display font-bold text-xl text-foreground mb-1">
                      Connect with {ownerName}
                    </h2>
                    <p className="text-xs text-fg-3 line-clamp-1">{businessTitle}</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-fg-3 hover:text-foreground hover:bg-surface/10 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Connection type chip */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs text-fg-3">Request type:</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: listingType === 'ACQUISITION'
                        ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                      color: listingType === 'ACQUISITION' ? '#A78BFA' : '#60A5FA',
                      border: listingType === 'ACQUISITION'
                        ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(59,130,246,0.3)',
                    }}
                  >
                    {listingType === 'ACQUISITION' ? '🤝 Acquisition Enquiry' : '💰 Investment Enquiry'}
                  </span>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <label htmlFor="connect-message" className="label mb-2">
                    Your introduction *
                  </label>
                  <textarea
                    id="connect-message"
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Introduce yourself to ${ownerName}. Mention who you are, your background, and why you're interested in this business. Be specific — owners respond better to personalised messages.`}
                    className="input resize-none h-36 text-sm"
                    maxLength={MAX_MESSAGE}
                    disabled={loading}
                    aria-describedby="connect-message-hint"
                  />
                  <div className="flex justify-between mt-1.5" id="connect-message-hint">
                    <p className="text-[11px] text-fg-3">
                      {message.trim().length < MIN_MESSAGE
                        ? `${MIN_MESSAGE - message.trim().length} more chars required`
                        : '✓ Ready to send'
                      }
                    </p>
                    <p className="text-[11px] text-fg-3 tabular-nums">
                      {message.length} / {MAX_MESSAGE}
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div
                  className="rounded-2xl px-4 py-3 mb-5 text-xs leading-relaxed"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(253,186,116,0.8)' }}
                >
                  <strong className="text-amber-400">⚠ Disclaimer: </strong>
                  Finvest only facilitates this connection. We do not guarantee any deal,
                  investment, or transaction. Conduct your own due diligence before proceeding.
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-fg-2 hover:text-foreground transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading || message.trim().length < MIN_MESSAGE}
                    className="flex-[2] py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #6B21A8, #8B5CF6)',
                      boxShadow: message.trim().length >= MIN_MESSAGE ? '0 4px 15px rgba(107,33,168,0.4)' : 'none',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Sending…
                      </span>
                    ) : '🤝 Send Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
