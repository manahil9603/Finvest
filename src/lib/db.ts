import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/** Standard Next.js + Prisma singleton (global in dev survives HMR; restart after `prisma generate` if delegates look stale). */
export const prisma =
  globalForPrisma.prisma ??
  (globalForPrisma.prisma = createPrisma())

/** Same instance as {@link prisma} — useful for symmetry with APIs that prefer a callable. */
export function getPrisma(): PrismaClient {
  return prisma
}
