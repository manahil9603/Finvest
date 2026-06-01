import { redirect, notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ChatWindow } from '@/components/chat/ChatWindow'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Chat' }

export default async function ChatPage({ params }: PageProps) {
  const { id: partnerId } = await params
  const auth = await getAuthUser()
  if (!auth) redirect('/login?redirect=/messages')

  const other = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, role: true },
  })

  if (!other || other.id === auth.userId) notFound()

  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: auth.userId, read: false },
    data: { read: true },
  })

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: auth.userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: auth.userId },
      ],
    },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-220px)] flex flex-col">
      <ChatWindow
        conversationId={partnerId}
        currentUserId={auth.userId}
        otherUser={other}
        initialMessages={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
