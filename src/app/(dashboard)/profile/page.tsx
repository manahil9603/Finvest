'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', city: '', bio: '', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setUser(data)
          setForm({
            name: data.name ?? '',
            phone: data.phone ?? '',
            city: data.city ?? '',
            bio: data.bio ?? '',
            companyName: data.companyName ?? '',
          })
        } else {
          router.push('/login')
        }
      })
      .finally(() => setFetching(false))
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Update failed'); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault()
    setDeleteError('')
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error ?? 'Could not delete account')
        return
      }
      router.push(data.redirect ?? '/')
      router.refresh()
    } catch {
      setDeleteError('Network error')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (fetching) return <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Profile</h1>

      {user && (
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#01411C]/10 rounded-full flex items-center justify-center text-[#01411C] font-black text-2xl">
            {user.name?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge bg-[#01411C]/10 text-[#01411C] text-xs">{user.role?.replace('_', ' ')}</span>
              {user.verified && <span className="badge bg-green-100 text-green-700 text-xs">✅ Verified</span>}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-900 mb-2">Edit Profile</h2>
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">Profile updated!</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+92-300-…" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" placeholder="Lahore" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Company / Organisation</label>
          <input className="input" placeholder="Khan Enterprises" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input h-28 resize-none" placeholder="Tell other users about yourself…"
            value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <section className="card p-6 mt-8 border-red-200">
        <h2 className="font-bold text-red-700 mb-1">Delete account</h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently remove your account, listings, messages, and connections. This cannot be undone.
        </p>

        {!showDelete ? (
          <button
            type="button"
            onClick={() => { setShowDelete(true); setDeleteError(''); setDeletePassword('') }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-red-700 border border-red-300 hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg" role="alert">
                {deleteError}
              </div>
            )}
            <div>
              <label htmlFor="delete-password" className="label text-red-800">
                Enter your password to confirm
              </label>
              <input
                id="delete-password"
                type="password"
                className="input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={deleteLoading}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={deleteLoading || !deletePassword}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => { setShowDelete(false); setDeletePassword(''); setDeleteError('') }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
