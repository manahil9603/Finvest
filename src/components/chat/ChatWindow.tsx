'use client'
import { useState, useEffect, useRef, FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: { id: string; name: string }
}

interface OtherUser {
  id: string
  name: string
  role: string
}

interface Props {
  conversationId: string
  currentUserId: string
  otherUser: OtherUser | undefined
  initialMessages: Message[]
}

export function ChatWindow({ conversationId, currentUserId, otherUser, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    const socketOptions = { transports: ['websocket', 'polling'] }
    const socket = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions)
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('join-conversation', conversationId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('new-message', (msg: Message) => {
      if (msg.senderId !== currentUserId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => { socket.disconnect() }
  }, [conversationId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const content = input.trim()
    setInput('')
    setLoading(true)

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, name: 'You' },
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.data : m))
        )
        socketRef.current?.emit('send-message', { conversationId, message: data.data })
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="card p-4 flex items-center gap-3 mb-4 shrink-0">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <div className="w-10 h-10 bg-[#01411C]/10 rounded-full flex items-center justify-center text-[#01411C] font-black">
          {otherUser?.name.charAt(0) ?? '?'}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{otherUser?.name ?? 'Unknown'}</div>
          <div className="text-xs text-gray-500">{otherUser?.role?.replace('_', ' ')}</div>
        </div>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} title={connected ? 'Connected' : 'Offline'} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            Start the conversation. Be professional and respectful.
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isMine
                    ? 'bg-[#01411C] text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{timeAgo(msg.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer in chat */}
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 shrink-0">
        ⚠ Finvest facilitates connections only. Do not share sensitive financial documents through this chat.
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 shrink-0">
        <input
          className="input flex-1"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary px-5 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
