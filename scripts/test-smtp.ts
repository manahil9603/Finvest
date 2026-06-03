/**
 * Test SMTP config: npx ts-node --project tsconfig.server.json scripts/test-smtp.ts [recipient]
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import nodemailer from 'nodemailer'

function loadEnvFile(name: string) {
  const path = resolve(process.cwd(), name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')

async function main() {
  const to = process.argv[2] ?? process.env.SMTP_USER
  if (!to) {
    console.error('Usage: npx ts-node scripts/test-smtp.ts you@example.com')
    process.exit(1)
  }

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM ?? user

  console.log('SMTP_HOST:', host ?? '(missing)')
  console.log('SMTP_USER:', user ?? '(missing)')
  console.log('SMTP_PASS:', pass ? `(${pass.length} chars)` : '(missing)')
  console.log('EMAIL_FROM:', from ?? '(missing)')
  console.log('Sending test to:', to)

  if (!host || !user || !pass) {
    console.error('\nMissing SMTP_HOST, SMTP_USER, or SMTP_PASS')
    process.exit(1)
  }

  const port = Number(process.env.SMTP_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user, pass },
  })

  try {
    await transport.verify()
    console.log('\n✓ SMTP connection verified')
  } catch (e) {
    console.error('\n✗ SMTP verify failed:', e)
    process.exit(1)
  }

  try {
    const info = await transport.sendMail({
      from: from!,
      to,
      subject: 'Finvest SMTP test',
      text: 'If you received this, SMTP is working.',
    })
    console.log('✓ Sent:', info.messageId)
  } catch (e) {
    console.error('✗ Send failed:', e)
    process.exit(1)
  }
}

main()
