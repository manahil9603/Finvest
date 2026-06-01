import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { getRoleRedirect } from '@/lib/constants'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const auth = await getAuthUser()
  if (!auth) redirect('/login?redirect=/dashboard')

  redirect(getRoleRedirect(auth.role))
}
