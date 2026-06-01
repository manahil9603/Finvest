'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket, dmRoomId, type IncomingMessage } from '@/hooks/useSocket'
import { useToast } from '@/hooks/useToast'
import { ConversationList, type Thread } from './ConversationList'
import { ChatWindow } from './ChatWindow'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Props {
  currentUserId:   string
  initialThreads:  Thread[]
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildThreads(
  existing: Thread[],
  messages: IncomingMessage[],
  currentUserId: string
): Thread[] {
  // For quick rebuild of threads from raw messages — used after new message arrives
  const map = new Map<string, Thread>()

  // Seed with existing threads first
  for (const t of existing) map.set(t.partnerId, t)

  // Override with any newer info
  for (const msg of messages.slice().reverse()) {
    const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId
    const isMine    = msg.senderId === currentUserId
    const existing  = map.get(partnerId)
    if (existing) {
      map.set(partnerId, {
        ...existing,
        lastMessage:   msg.content,
        lastMessageAt: msg.createdAt,
        isMine,
        unreadCount:   isMine ? existing.unreadCount : existing.unreadCount + 1,
      })
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────

export function MessagesShell({ currentUserId, initialThreads }: Props) {
  const searchParams = useSearchParams()
  const { info } = useToast()

  const [threads,        setThreads]        = useState<Thread[]>(initialThreads)
  const [activeThread,   setActiveThread]   = useState<Thread | null>(null)
  const [messages,       setMessages]       = useState<IncomingMessage[]>([])
  const [loadingMsgs,    setLoadingMsgs]    = useState(false)
  const [sending,        setSending]        = useState(false)
  const [partnerTyping,  setPartnerTyping]  = useState(false)
  const [onlineIds,      setOnlineIds]      = useState<Set<string>>(new Set())
  const [mobileView,     setMobileView]     = useState<'inbox' | 'chat'>('inbox')

  const activeRoomRef  = useRef<string | null>(null)
  const activeThreadRef = useRef<Thread | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const typingStopTimer = useRef<ReturnType<typeof setTimeout>>()

  activeThreadRef.current = activeThread

  // ── Socket.io ──────────────────────────────────────────────

  const handleNewMessage = useCallback((msg: IncomingMessage) => {
    // If from current conversation, append
    if (
      activeThreadRef.current &&
      (msg.senderId === activeThreadRef.current.partnerId ||
       msg.receiverId === activeThreadRef.current.partnerId)
    ) {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      return
    }

    // Otherwise it's a background message — show toast
    setThreads((prev) => {
      const updated = prev.map((t) =>
        t.partnerId === msg.senderId
          ? { ...t, lastMessage: msg.content, lastMessageAt: msg.createdAt, unreadCount: t.unreadCount + 1, isMine: false }
          : t
      )
      // Sort by newest
      return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    })

    const sender = initialThreads.find((t) => t.partnerId === msg.senderId)
    info(`New message from ${sender?.partnerName ?? 'someone'}`, msg.content.slice(0, 80))
  }, [info, initialThreads])

  const handleTyping = useCallback((partnerId: string, isTyping: boolean) => {
    if (activeThreadRef.current?.partnerId === partnerId) {
      setPartnerTyping(isTyping)
      if (isTyping) {
        clearTimeout(typingStopTimer.current)
        typingStopTimer.current = setTimeout(() => setPartnerTyping(false), 4000)
      }
    }
  }, [])

  const handlePresence = useCallback((partnerId: string, online: boolean) => {
    setOnlineIds((prev) => {
      const next = new Set(prev)
      online ? next.add(partnerId) : next.delete(partnerId)
      return next
    })
  }, [])

  const handleMessagesRead = useCallback((_readerId: string) => {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })))
  }, [])

  const {
    connected: socketConnected,
    usePolling,
    joinRoom,
    leaveRoom,
    emitMessage,
    emitTypingStart,
    emitTypingStop,
    emitMessagesRead,
  } = useSocket({
    userId:           currentUserId,
    onNewMessage:     handleNewMessage,
    onUserTyping:     handleTyping,
    onPresenceChange: handlePresence,
    onMessagesRead:   handleMessagesRead,
  })

  // ── Polling fallback ──────────────────────────────────────

  useEffect(() => {
    if (!usePolling || !activeThread) return

    const poll = async () => {
      const last = messages[messages.length - 1]
      const since = last ? `?since=${last.createdAt}` : ''
      const res = await fetch(`/api/messages/${activeThread.partnerId}${since}`)
      if (res.ok) {
        const data = await res.json()
        const newMsgs: IncomingMessage[] = data.data.messages ?? []
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id))
            return [...prev, ...newMsgs.filter((m) => !ids.has(m.id))]
          })
        }
      }
    }

    pollIntervalRef.current = setInterval(poll, 5000)
    return () => clearInterval(pollIntervalRef.current)
  }, [usePolling, activeThread?.partnerId, messages])

  // ── Open conversation ─────────────────────────────────────

  const openConversation = useCallback(async (thread: Thread) => {
    // Leave old room
    if (activeRoomRef.current) leaveRoom(activeRoomRef.current)

    const roomId = dmRoomId(currentUserId, thread.partnerId)
    activeRoomRef.current = roomId
    setActiveThread(thread)
    setMessages([])
    setLoadingMsgs(true)
    setPartnerTyping(false)
    setMobileView('chat')

    // Join new room
    joinRoom(roomId)

    try {
      const res  = await fetch(`/api/messages/${thread.partnerId}`)
      const data = await res.json()
      if (res.ok) {
        setMessages(data.data.messages ?? [])
        // Signal read
        emitMessagesRead(roomId)
        // Clear unread in sidebar
        setThreads((prev) =>
          prev.map((t) => t.partnerId === thread.partnerId ? { ...t, unreadCount: 0 } : t)
        )
      }
    } finally {
      setLoadingMsgs(false)
    }
  }, [currentUserId, joinRoom, leaveRoom, emitMessagesRead])

  // ── Auto-open from ?with= URL param ──────────────────────

  useEffect(() => {
    const withId = searchParams.get('with')
    if (withId) {
      const thread = initialThreads.find((t) => t.partnerId === withId)
      if (thread) openConversation(thread)
    }
  }, []) // eslint-disable-line

  // ── Send message ─────────────────────────────────────────

  const handleSend = useCallback(async (content: string) => {
    if (!activeThreadRef.current) return
    setSending(true)

    const temp: IncomingMessage = {
      id:         `temp-${Date.now()}`,
      senderId:   currentUserId,
      receiverId: activeThreadRef.current.partnerId,
      content,
      read:       false,
      createdAt:  new Date().toISOString(),
    }
    setMessages((prev) => [...prev, temp])

    try {
      const res  = await fetch(`/api/messages/${activeThreadRef.current.partnerId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
      })
      const data = await res.json()

      if (res.ok) {
        const real: IncomingMessage = data.data
        setMessages((prev) => prev.map((m) => m.id === temp.id ? real : m))

        // Broadcast via socket
        if (activeRoomRef.current) {
          emitMessage(activeRoomRef.current, real)
        }

        // Update thread preview
        setThreads((prev) =>
          prev.map((t) =>
            t.partnerId === activeThreadRef.current!.partnerId
              ? { ...t, lastMessage: content, lastMessageAt: real.createdAt, isMine: true }
              : t
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        )
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      }
    } finally {
      setSending(false)
    }
  }, [currentUserId, emitMessage])

  // ── Typing events ─────────────────────────────────────────

  const handleTypingStart = useCallback(() => {
    if (activeRoomRef.current) emitTypingStart(activeRoomRef.current)
  }, [emitTypingStart])

  const handleTypingStop = useCallback(() => {
    if (activeRoomRef.current) emitTypingStop(activeRoomRef.current)
  }, [emitTypingStop])

  const partnerOnline = activeThread ? onlineIds.has(activeThread.partnerId) : false

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-[calc(100dvh-130px)] rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Left sidebar: conversation list ─────────────── */}
      <div
        className={`
          w-full lg:w-[300px] xl:w-[320px] shrink-0 flex flex-col
          ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
        `}
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <ConversationList
          threads={threads}
          activePartnerId={activeThread?.partnerId ?? null}
          onlineIds={onlineIds}
          currentUserId={currentUserId}
          onSelect={openConversation}
        />
      </div>

      {/* ── Right: chat window ───────────────────────────── */}
      <div className={`flex-1 min-w-0 flex flex-col ${mobileView === 'inbox' ? 'hidden lg:flex' : 'flex'}`}>
        <ChatWindow
          thread={activeThread}
          messages={messages}
          loading={loadingMsgs}
          sending={sending}
          currentUserId={currentUserId}
          partnerTyping={partnerTyping}
          partnerOnline={partnerOnline}
          socketConnected={socketConnected}
          onSend={handleSend}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onBack={() => setMobileView('inbox')}
        />
      </div>
    </div>
  )
}
