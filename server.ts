import { createServer } from 'http'
import { Server } from 'socket.io'
import next from 'next'
import { parse } from 'url'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST ?? '0.0.0.0'
const port = Number.parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '')
}

function buildAllowedOrigins() {
  const origins = new Set<string>([
    normalizeOrigin(process.env.NEXTAUTH_URL ?? `http://localhost:${port}`),
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ])

  process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => origins.add(normalizeOrigin(origin)))

  return origins
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url ?? '/', true))
  })

  const allowedOrigins = buildAllowedOrigins()
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(null, !origin || allowedOrigins.has(normalizeOrigin(origin)))
      },
      methods: ['GET', 'POST'],
    },
  })

  // Online presence: userId -> Set<socketId>
  const onlineUsers = new Map<string, Set<string>>()

  function broadcastPresence(userId: string) {
    const isOnline = (onlineUsers.get(userId)?.size ?? 0) > 0
    io.emit('presence', { userId, online: isOnline })
  }

  io.on('connection', (socket) => {
    let registeredUserId: string | null = null

    socket.on('register', (userId: string) => {
      registeredUserId = userId
      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
      onlineUsers.get(userId)!.add(socket.id)
      broadcastPresence(userId)
    })

    // roomId convention: `dm:${[uid1,uid2].sort().join(':')}`
    socket.on('join-conversation', (roomId: string) => {
      socket.join(roomId)
    })

    socket.on('leave-conversation', (roomId: string) => {
      socket.leave(roomId)
    })

    socket.on('send-message', ({
      conversationId,
      message,
    }: { conversationId: string; message: unknown }) => {
      socket.to(conversationId).emit('new-message', message)
    })

    socket.on('typing-start', ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit('user-typing', { userId, isTyping: true })
    })

    socket.on('typing-stop', ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit('user-typing', { userId, isTyping: false })
    })

    socket.on('messages-read', ({ roomId, readerId }: { roomId: string; readerId: string }) => {
      socket.to(roomId).emit('messages-read', { readerId })
    })

    socket.on('disconnect', () => {
      if (registeredUserId) {
        onlineUsers.get(registeredUserId)?.delete(socket.id)
        broadcastPresence(registeredUserId)
      }
    })
  })

  httpServer.listen(port, () => {
    const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname
    console.log(`> Finvest ready on http://${displayHost}:${port}`)
    console.log('> Socket.io sharing the Next.js HTTP server')
  })
}).catch((error) => {
  console.error('Failed to start Finvest server', error)
  process.exit(1)
})
