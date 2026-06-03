import { createHash, randomBytes } from 'crypto'

export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export function generatePasswordResetToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString('hex')
  return { plain, hash: hashPasswordResetToken(plain) }
}

export function hashPasswordResetToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}
