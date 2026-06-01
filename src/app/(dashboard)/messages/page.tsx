import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MessagesShell } from '@/components/messages/MessagesShell'
import type { Thread } from '@/components/messages/ConversationList'

export const metadata: Metadata = { title: 'Messages' }

// ── Build inbox threads from raw messages ─────────────────────────────────────

async function getInboxThreads(userId: string): Promise<Thread[]> {
  // Fetch all messages involving this user
  const allMessages = await prisma.message.findMany({
    where: { OR: [{ receiverId: userId }, { senderId: userId }] },
    include: {
      sender:   { select: { id: true, name: true, role: true, verified: true } },
      receiver: { select: { id: true, name: true, role: true, verified: true } },
    },
    orderBy: { createdAt: 'desc' },
    take:    300,
  })

  // Group by conversation partner (deduplicate to one thread per partner)
  const map = new Map<string, Thread>()

  for (const msg of allMessages) {
    const isMine    = msg.senderId === userId
    const partner   = isMine ? msg.receiver : msg.sender
    const partnerId = partner.id

    if (map.has(partnerId)) continue   // already have the latest message for this partner

    map.set(partnerId, {
      partnerId,
      partnerName:     partner.name,
      partnerRole:     partner.role,
      partnerVerified: partner.verified,
      lastMessage:     msg.content,
      lastMessageAt:   msg.createdAt.toISOString(),
      isMine,
      // unread count computed below
      unreadCount: 0,
    })
  }

  // Compute unread count per partner
  const unreadRows = await prisma.message.groupBy({
    by:     ['senderId'],
    where:  { receiverId: userId, read: false },
    _count: { id: true },
  })

  for (const row of unreadRows) {
    const thread = map.get(row.senderId)
    if (thread) thread.unreadCount = row._count.id
  }

  return [...map.values()]
}

// ── Page ──────────────────────────────────────────────────────────────────────

function MessagesLoading() {
  return (
    <div
      className="flex h-[calc(100dvh-130px)] rounded-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="w-[320px] shrink-0 p-5 space-y-4 border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="skeleton h-9 w-full rounded-xl" />
        {[1,2,3,4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="skeleton w-11 h-11 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl opacity-20">💬</div>
      </div>
    </div>
  )
}

export default async function MessagesPage() {
  const auth = await requireAuth()   // any authenticated user

  const [user, threads] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: auth.userId },
      select: { id: true, name: true },
    }),
    getInboxThreads(auth.userId),
  ])

  if (!user) redirect('/login')

  return (
    <div className="space-y-4">
      {/* Page header (outside the shell so it shows above the chat panel) */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-fg-3 mb-0.5">Direct Messages</p>
        <h1 className="font-display font-black text-2xl text-foreground">
          Messages
          {threads.some((t) => t.unreadCount > 0) && (
            <span
              className="ml-2 text-sm font-bold px-2 py-0.5 rounded-full align-middle"
              style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}
            >
              {threads.reduce((s, t) => s + t.unreadCount, 0)} unread
            </span>
          )}
        </h1>
      </div>

      {/* MessagesShell uses useSearchParams so it needs Suspense */}
      <Suspense fallback={<MessagesLoading />}>
        <MessagesShell
          currentUserId={auth.userId}
          initialThreads={threads}
        />
      </Suspense>
    </div>
  )
}
