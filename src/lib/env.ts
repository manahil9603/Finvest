/**
 * Validated, typed environment variables.
 *
 * Import from this module instead of process.env directly so that:
 *   1. Missing / weak secrets are caught at startup with clear messages.
 *   2. TypeScript sees all vars as non-nullable strings.
 *   3. One place to audit what secrets the app depends on.
 */

import { z } from 'zod'

const schema = z.object({
  // Database
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty')
    .startsWith('postgresql://', 'DATABASE_URL must be a PostgreSQL connection string'),

  // Authentication
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required' })
    .min(32, 'JWT_SECRET must be at least 32 characters to be cryptographically safe'),

  // Application
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL')
    .default('http://localhost:3000'),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Socket.io (optional; defaults to the current browser origin)
  NEXT_PUBLIC_SOCKET_URL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().url('NEXT_PUBLIC_SOCKET_URL must be a valid URL').optional()
  ),

  // CORS — comma-separated list of allowed origins (optional, defaults to NEXTAUTH_URL)
  ALLOWED_ORIGINS: z.string().optional(),
})

function validateEnv() {
  const result = schema.safeParse(process.env)

  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  • ${i.path.join('.')}: ${i.message}`
    )
    const msg = `\n❌  Invalid environment variables:\n${lines.join('\n')}\n`

    // In production fail hard — in dev print a warning and use safe defaults
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }

  return result.data ?? (process.env as unknown as z.infer<typeof schema>)
}

export const env = validateEnv()

/** Comma-separated ALLOWED_ORIGINS → Set<string> */
export function getAllowedOrigins(): Set<string> {
  const base = new Set([env.NEXTAUTH_URL])
  if (env.ALLOWED_ORIGINS) {
    env.ALLOWED_ORIGINS.split(',').forEach((o) => base.add(o.trim()))
  }
  if (env.NODE_ENV === 'production') {
    base.add('https://finvest.pk')
    base.add('https://www.finvest.pk')
  }
  return base
}
