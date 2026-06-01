'use client'

import { useState } from 'react'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface Thread {
  partnerId:     string
  partnerName:   string
  partnerRole:   string
  partnerVerified: boolean
  lastMessage:   string
  lastMessageAt: string
  unreadCount:   number
  isMine:        boolean
}

interface Props {
  threads:          Thread[]
  activePartnerId:  string | null
  onlineIds:        Set<string>
  currentUserId:    string
  onSelect:         (thread: Thread) => void
}

const ROLE_COLOR: Record<string, string> = {
  BUSINESS_OWNER: '#FCD34D',
  INVESTOR:       '#34D399',
  BUYER:          '#60A5FA',
  ADMIN:          '#A78BFA',
}

function RoleInitialAvatar({ name, role, size = 10 }: { name: string; role: string; size?: number }) {
  const color = ROLE_COLOR[role] ?? '#A1A1AA'
  return (
    <div
      className={`shrink-0 rounded-2xl flex items-center justify-center font-black text-white text-sm`}
      style={{
        width: size * 4, height: size * 4,
        background: `linear-gradient(135deg, ${color}66, ${color})`,
      }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ConversationList({ threads, activePartnerId, onlineIds, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = threads.filter((t) =>
    !query || t.partnerName.toLowerCase().includes(query.toLowerCase())
  )

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-black text-xl text-foreground">Messages</h1>
            {totalUnread > 0 && (
              <p className="text-xs text-fg-3 mt-0.5">
                <span style={{ color: '#A78BFA' }}>{totalUnread} unread</span>
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
               width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.3)' }} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Search conversations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-fg-2 text-sm font-medium">
              {query ? 'No conversations match your search.' : 'No messages yet.'}
            </p>
            {!query && (
              <p className="text-fg-3 text-xs mt-1">
                Send a connection request to start chatting.
              </p>
            )}
          </div>
        ) : (
          filtered.map((thread) => {
            const isActive  = thread.partnerId === activePartnerId
            const isOnline  = onlineIds.has(thread.partnerId)

            return (
              <button
                key={thread.partnerId}
                onClick={() => onSelect(thread)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150"
                style={{
                  background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                  borderLeft: isActive ? '2px solid #8B5CF6' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Avatar + online dot */}
                <div className="relative shrink-0">
                  <RoleInitialAvatar name={thread.partnerName} role={thread.partnerRole} size={11} />
                  {isOnline && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{ background: '#10B981', boxShadow: '0 0 0 2px rgb(var(--bg))' }}
                      title="Online"
                      aria-label="Online"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm truncate',
                      thread.unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'
                    )}>
                      {thread.partnerName}
                    </span>
                    <span className="text-[10px] text-fg-3 shrink-0 ml-2">
                      {timeAgo(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn(
                      'text-xs truncate flex-1',
                      thread.unreadCount > 0 ? 'text-fg-2' : 'text-fg-3'
                    )}>
                      {thread.isMine ? 'You: ' : ''}{thread.lastMessage}
                    </p>
                    {thread.unreadCount > 0 && (
                      <span
                        className="ml-2 shrink-0 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ background: '#8B5CF6' }}
                        aria-label={`${thread.unreadCount} unread messages`}
                      >
                        {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
