'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface IncomingMessage {
  id:         string
  senderId:   string
  receiverId: string
  content:    string
  read:       boolean
  createdAt:  string
}

interface UseSocketOptions {
  userId:           string
  onNewMessage:     (msg: IncomingMessage) => void
  onUserTyping:     (partnerId: string, isTyping: boolean) => void
  onPresenceChange: (partnerId: string, online: boolean) => void
  onMessagesRead:   (readerId: string) => void
}

/** DM room ID: canonical sorted pair so both users get the same string */
export function dmRoomId(uid1: string, uid2: string): string {
  return `dm:${[uid1, uid2].sort().join(':')}`
}

export function useSocket({
  userId,
  onNewMessage,
  onUserTyping,
  onPresenceChange,
  onMessagesRead,
}: UseSocketOptions) {
  const socketRef  = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [usePolling, setUsePolling] = useState(false)

  // Stable callback refs so the effect doesn't need to re-run on every render
  const cbRefs = useRef({ onNewMessage, onUserTyping, onPresenceChange, onMessagesRead })
  useEffect(() => { cbRefs.current = { onNewMessage, onUserTyping, onPresenceChange, onMessagesRead } }, [onNewMessage, onUserTyping, onPresenceChange, onMessagesRead])

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    const socketOptions = {
      transports:          ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
      timeout:              5000,
    }
    const socket = socketUrl ? io(socketUrl, socketOptions) : io(socketOptions)
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setUsePolling(false)
      // Identify this browser session as `userId`
      socket.emit('register', userId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('connect_error', () => {
      // If we can't connect after initial attempts, fall back to polling
      if (!socket.connected) setUsePolling(true)
    })

    socket.on('new-message',  (msg: IncomingMessage)                        => cbRefs.current.onNewMessage(msg))
    socket.on('user-typing',  ({ userId: uid, isTyping }: { userId: string; isTyping: boolean }) => cbRefs.current.onUserTyping(uid, isTyping))
    socket.on('presence',     ({ userId: uid, online }:  { userId: string; online: boolean  })   => cbRefs.current.onPresenceChange(uid, online))
    socket.on('messages-read',({ readerId }: { readerId: string })           => cbRefs.current.onMessagesRead(readerId))

    // Fall back to polling after 6 seconds if never connected
    const fallbackTimer = setTimeout(() => {
      if (!socket.connected) setUsePolling(true)
    }, 6000)

    return () => {
      clearTimeout(fallbackTimer)
      socket.disconnect()
    }
  }, [userId])

  // ── Actions ─────────────────────────────────────────────────────────────

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join-conversation', roomId)
  }, [])

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave-conversation', roomId)
  }, [])

  const emitMessage = useCallback((roomId: string, message: IncomingMessage) => {
    socketRef.current?.emit('send-message', { conversationId: roomId, message })
  }, [])

  const emitTypingStart = useCallback((roomId: string) => {
    socketRef.current?.emit('typing-start', { roomId, userId })
  }, [userId])

  const emitTypingStop = useCallback((roomId: string) => {
    socketRef.current?.emit('typing-stop', { roomId, userId })
  }, [userId])

  const emitMessagesRead = useCallback((roomId: string) => {
    socketRef.current?.emit('messages-read', { roomId, readerId: userId })
  }, [userId])

  return {
    connected,
    usePolling,
    joinRoom,
    leaveRoom,
    emitMessage,
    emitTypingStart,
    emitTypingStop,
    emitMessagesRead,
  }
}
