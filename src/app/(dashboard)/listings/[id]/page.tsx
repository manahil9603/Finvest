import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  return { title: `Business ${id}` }
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/businesses/${id}`)
}
