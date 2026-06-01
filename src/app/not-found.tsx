import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-8xl font-black text-[#01411C] mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  )
}
