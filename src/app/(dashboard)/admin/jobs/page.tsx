import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { JobsAdminPanel } from '@/components/admin/JobsAdminPanel'

export const metadata: Metadata = { title: 'Admin — Careers' }

export default async function AdminJobsPage() {
  await requireAuth(['ADMIN'])
  return <JobsAdminPanel />
}
