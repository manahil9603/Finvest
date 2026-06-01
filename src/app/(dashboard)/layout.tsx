import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Disclaimer } from '@/components/layout/Disclaimer'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser()

  const user = auth
    ? await prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true, email: true, name: true, role: true,
          phone: true, city: true, bio: true,
          verified: true, createdAt: true, updatedAt: true,
        },
      })
    : null

  return (
    <div className="min-h-dvh flex flex-col">
      <Disclaimer />
      <Navbar user={user as any} />
      <main id="main-content" className="flex-1 py-8 page-container" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  )
}
