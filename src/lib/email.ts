import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { ROLE_META } from '@/lib/constants'

// ── Config ────────────────────────────────────────────────────────────────────

function getAppUrl(): string {
  const url = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  return url.replace(/\/$/, '')
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim()
  if (from && from.includes('@')) return from
  const user = process.env.SMTP_USER?.trim()
  if (user) return `Finvest <${user}>`
  return 'Finvest <noreply@finvest.pk>'
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

function escapeHtml(text: string | undefined | null): string {
  if (text == null) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function roleLabel(role: string): string {
  const meta = ROLE_META[role as keyof typeof ROLE_META]
  return meta?.label ?? role.replace(/_/g, ' ')
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildAccountCreatedHtml(params: {
  name: string
  email: string
  role: string
  loginUrl: string
}): string {
  const { name, email, role, loginUrl } = params
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeRole = escapeHtml(roleLabel(role))

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,#6B21A8,#8B5CF6);">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">Finvest</p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Your account is ready</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;">Hi <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);">
              Your Finvest account has been created successfully. This confirms we can reach you at this email address.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:rgba(255,255,255,0.05);border-radius:12px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.45);">Account details</p>
                  <p style="margin:0 0 6px;font-size:14px;"><span style="color:rgba(255,255,255,0.5);">Email:</span> ${safeEmail}</p>
                  <p style="margin:0;font-size:14px;"><span style="color:rgba(255,255,255,0.5);">Role:</span> ${safeRole}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6B21A8,#8B5CF6);color:#fff;text-decoration:none;font-weight:600;border-radius:12px;font-size:14px;">Sign in to Finvest</a>
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">
              If you did not create this account, you can ignore this email. Need help? Contact support@finvest.pk
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildAccountCreatedText(params: {
  name: string
  email: string
  role: string
  loginUrl: string
}): string {
  const { name, email, role, loginUrl } = params
  return [
    `Hi ${name},`,
    '',
    'Your Finvest account has been created successfully.',
    '',
    `Email: ${email}`,
    `Role: ${roleLabel(role)}`,
    '',
    `Sign in: ${loginUrl}`,
    '',
    'If you did not create this account, you can ignore this email.',
  ].join('\n')
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AccountCreatedEmailParams {
  to:   string
  name: string
  role: string
}

function requireEmailConfigured(): void {
  if (!isEmailConfigured()) {
    throw new Error('SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS).')
  }
}

async function sendMailMessage(options: {
  to: string
  subject: string
  text: string
  html: string
  logLabel: string
}): Promise<void> {
  requireEmailConfigured()
  const info = await getTransporter().sendMail({
    from:    getFromAddress(),
    to:      options.to,
    subject: options.subject,
    text:    options.text,
    html:    options.html,
  })
  if (process.env.NODE_ENV === 'development') {
    console.log(`[email] ${options.logLabel} sent to ${options.to} (${info.messageId ?? 'ok'})`)
  }
}

/** Sends welcome email after registration. Throws if SMTP is missing or send fails. */
export async function sendAccountCreatedEmail(
  params: AccountCreatedEmailParams
): Promise<void> {
  const loginUrl = `${getAppUrl()}/login`
  const body     = { name: params.name, email: params.to, role: params.role, loginUrl }
  await sendMailMessage({
    to:       params.to,
    subject:  'Your Finvest account has been created',
    text:     buildAccountCreatedText(body),
    html:     buildAccountCreatedHtml(body),
    logLabel: 'Welcome email',
  })
}

// ── Password reset email ──────────────────────────────────────────────────────

function buildPasswordResetHtml(params: { name: string; resetUrl: string }): string {
  const safeName = escapeHtml(params.name)
  const safeUrl  = escapeHtml(params.resetUrl)
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px;background:linear-gradient(135deg,#6B21A8,#8B5CF6);">
            <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">Finvest</p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Reset your password</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:rgba(255,255,255,0.9);font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;">Hi <strong>${safeName}</strong>,</p>
            <p style="margin:0 0 16px;color:rgba(255,255,255,0.75);">
              We received a request to reset your Finvest password. This link expires in 1 hour.
            </p>
            <p style="margin:0 0 24px;text-align:center;">
              <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6B21A8,#8B5CF6);color:#fff;text-decoration:none;font-weight:600;border-radius:12px;font-size:14px;">Reset password</a>
            </p>
            <p style="margin:0 0 12px;font-size:12px;color:rgba(255,255,255,0.45);word-break:break-all;">${safeUrl}</p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">
              If you did not request this, ignore this email. Your password will not change.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildPasswordResetText(params: { name: string; resetUrl: string }): string {
  return [
    `Hi ${params.name},`,
    '',
    'Reset your Finvest password using this link (expires in 1 hour):',
    params.resetUrl,
    '',
    'If you did not request this, ignore this email.',
  ].join('\n')
}

export interface PasswordResetEmailParams {
  to:       string
  name:     string
  resetUrl: string
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  await sendMailMessage({
    to:       params.to,
    subject:  'Reset your Finvest password',
    text:     buildPasswordResetText({ name: params.name, resetUrl: params.resetUrl }),
    html:     buildPasswordResetHtml({ name: params.name, resetUrl: params.resetUrl }),
    logLabel: 'Password reset email',
  })
}
