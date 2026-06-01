import { redirect } from 'next/navigation'

export const metadata = { title: 'Browse Businesses' }

export default function ListingsPage() {
  redirect('/explore')
}
