'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ContactButton({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const send = async () => {
    if (!message.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: ownerId, message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSent(true)
      router.push(`/messages/${data.data.conversationId}`)
    } catch {
      setError('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <div className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg">Message sent!</div>

  if (showForm) {
    return (
      <div className="space-y-2">
        <textarea
          className="input resize-none h-24 text-sm"
          placeholder={`Introduce yourself to ${ownerName}…`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
          <button onClick={send} disabled={loading || !message.trim()} className="btn-primary flex-1 py-2 text-sm">
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setShowForm(true)} className="btn-primary w-full py-2.5">
      💬 Contact Owner
    </button>
  )
}
