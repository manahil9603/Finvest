'use client'

import { useEffect, useRef, useCallback, useState, FormEvent, KeyboardEvent } from 'react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { IncomingMessage } from '@/hooks/useSocket'
import type { Thread } from './ConversationList'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Partner {
  id:       string
  name:     string
  role:     string
  verified: boolean
  city:     string | null
}

interface Props {
  thread:        Thread | null
  messages:      IncomingMessage[]
  loading:       boolean
  sending:       boolean
  currentUserId: string
  partnerTyping: boolean
  partnerOnline: boolean
  socketConnected: boolean
  onSend:        (content: string) => void
  onTypingStart: () => void
  onTypingStop:  () => void
  onBack:        () => void   // mobile: return to inbox
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingBubble({ name }: { name: string }) {
  return (
    <div className="flex items-end gap-2.5" aria-live="polite" aria-label={`${name} is typing`}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        aria-hidden="true"
      >
        {name.charAt(0)}
      </div>
      <div
        className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.4)',
              animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <span className="text-[11px] text-fg-3 shrink-0 font-medium">
        {new Date(date).toLocaleDateString('en-PK', { weekday: 'long', month: 'short', day: 'numeric' })}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

// ── Single message bubble ─────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  showAvatar,
  partnerName,
  isTemp,
}: {
  msg:         IncomingMessage
  isMine:      boolean
  showAvatar:  boolean
  partnerName: string
  isTemp:      boolean
}) {
  return (
    <div className={`flex items-end gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (partner only, only on last message in group) */}
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-hidden="true"
          >
            {partnerName.charAt(0)}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-2.5 text-sm leading-relaxed"
          style={
            isMine
              ? {
                  background:   isTemp ? 'rgba(139,92,246,0.6)' : 'linear-gradient(135deg,#6B21A8,#8B5CF6)',
                  color:        '#fff',
                  borderRadius: '1.25rem 1.25rem 0.3rem 1.25rem',
                  opacity:      isTemp ? 0.75 : 1,
                }
              : {
                  background:   'rgba(255,255,255,0.07)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  color:        'rgba(255,255,255,0.9)',
                  borderRadius: '1.25rem 1.25rem 1.25rem 0.3rem',
                }
          }
        >
          {msg.content}
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <time
            className="text-[10px] text-fg-3"
            dateTime={msg.createdAt}
            title={formatDate(msg.createdAt)}
          >
            {timeAgo(msg.createdAt)}
          </time>
          {isMine && !isTemp && (
            <span
              className="text-[10px]"
              style={{ color: msg.read ? '#60A5FA' : 'rgba(255,255,255,0.3)' }}
              title={msg.read ? 'Read' : 'Delivered'}
              aria-label={msg.read ? 'Read' : 'Delivered'}
            >
              {msg.read ? '✓✓' : '✓'}
            </span>
          )}
          {isTemp && <span className="text-[10px] text-fg-3">Sending…</span>}
        </div>
      </div>
    </div>
  )
}

// ── Main ChatWindow ───────────────────────────────────────────────────────────

export function ChatWindow({
  thread,
  messages,
  loading,
  sending,
  currentUserId,
  partnerTyping,
  partnerOnline,
  socketConnected,
  onSend,
  onTypingStart,
  onTypingStop,
  onBack,
}: Props) {
  const [input, setInput] = useState('')
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>()
  const isTypingRef = useRef(false)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, partnerTyping])

  // Focus input when thread changes
  useEffect(() => {
    if (thread) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setInput('')
    }
  }, [thread?.partnerId])

  // Input change with typing event
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTypingStart()
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false
      onTypingStop()
    }, 2000)
  }, [onTypingStart, onTypingStop])

  const handleSend = useCallback(() => {
    const content = input.trim()
    if (!content || sending) return
    clearTimeout(typingTimer.current)
    isTypingRef.current = false
    onTypingStop()
    setInput('')
    onSend(content)
  }, [input, sending, onSend, onTypingStop])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ── Empty state ────────────────────────────────────────────────────────
  if (!thread) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-5"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          aria-hidden="true"
        >
          💬
        </div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Your messages</h3>
        <p className="text-fg-2 text-sm max-w-xs leading-relaxed">
          Select a conversation from the sidebar, or send a connection request to start a new one.
        </p>
        <div className="mt-6 text-xs text-fg-3 px-4 py-2 rounded-xl"
             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(253,186,116,0.7)' }}>
          ⚠ You can only message users with whom you have an accepted connection.
        </div>
      </div>
    )
  }

  // Group messages by date for separators
  const grouped: { date: string; msgs: IncomingMessage[] }[] = []
  for (const msg of messages) {
    const dateKey = msg.createdAt.split('T')[0]!
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== dateKey) {
      grouped.push({ date: dateKey, msgs: [msg] })
    } else {
      last.msgs.push(msg)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(16px)' }}
      >
        {/* Mobile back */}
        <button
          onClick={onBack}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl text-fg-3 hover:text-foreground hover:bg-surface/10 transition-colors"
          aria-label="Back to inbox"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Avatar + status */}
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#6B21A8,#8B5CF6)' }}
            aria-hidden="true"
          >
            {thread.partnerName.charAt(0)}
          </div>
          {partnerOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-brand-green ring-2 ring-background" title="Online" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm text-foreground truncate">{thread.partnerName}</p>
            {thread.partnerVerified && <span className="text-brand-green text-xs">✅</span>}
          </div>
          <p className="text-[11px] text-fg-3">
            {partnerTyping
              ? <span style={{ color: '#8B5CF6' }}>typing…</span>
              : partnerOnline
              ? <span style={{ color: '#34D399' }}>● Online</span>
              : thread.partnerRole.replace('_', ' ')}
          </p>
        </div>

        {/* Connection status */}
        <div
          className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
          style={{
            background: socketConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color:      socketConnected ? '#34D399' : '#FCD34D',
          }}
          title={socketConnected ? 'Real-time connected' : 'Using fallback polling'}
        >
          {socketConnected ? '⚡ Live' : '⏱ Polling'}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 scrollbar-thin">
        {loading ? (
          <div className="flex flex-col gap-3 mt-4">
            {[80, 56, 72, 44, 96].map((w, i) => (
              <div key={i} className={`flex items-end gap-2.5 ${i % 2 ? 'flex-row-reverse' : ''}`}>
                <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
                <div className={`skeleton h-10 rounded-2xl`} style={{ width: `${w}%`, maxWidth: 300 }} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-fg-2 text-sm">Start the conversation.</p>
            <p className="text-fg-3 text-xs mt-1">Be professional and respectful.</p>
          </div>
        ) : (
          grouped.map(({ date, msgs }) => (
            <div key={date}>
              <DateSeparator date={date} />
              <div className="space-y-1.5">
                {msgs.map((msg, i) => {
                  const isMine    = msg.senderId === currentUserId
                  const isTemp    = msg.id.startsWith('temp-')
                  const nextMsg   = msgs[i + 1]
                  const showAvatar = !isMine && (!nextMsg || nextMsg.senderId !== msg.senderId)

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      partnerName={thread.partnerName}
                      isTemp={isTemp}
                    />
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {partnerTyping && (
          <TypingBubble name={thread.partnerName} />
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Legal note ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 py-2 text-[10px] text-center leading-relaxed"
        style={{ background: 'rgba(245,158,11,0.06)', borderTop: '1px solid rgba(245,158,11,0.12)', color: 'rgba(253,186,116,0.6)' }}
      >
        ⚠ Finvest facilitates connections only. Do not share sensitive financial documents in this chat.
      </div>

      {/* ── Input area ─────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 py-4 flex items-end gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,12,0.6)' }}
      >
        <textarea
          ref={inputRef}
          className="input flex-1 resize-none text-sm min-h-[44px] max-h-32"
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          style={{ lineHeight: '1.5' }}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-white transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:translate-y-0"
          style={{
            background: input.trim() && !sending
              ? 'linear-gradient(135deg,#6B21A8,#8B5CF6)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: input.trim() && !sending ? '0 4px 12px rgba(107,33,168,0.4)' : 'none',
          }}
          aria-label="Send message"
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
