import { z } from 'zod'

// ── Password helpers ──────────────────────────────────────────────────────────

export const PASSWORD_RULES = {
  minLength:   8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber:    /[0-9]/,
  hasSpecial:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
}

export type PasswordStrength = 'weak' | 'fair' | 'moderate' | 'strong' | 'very-strong'

export function getPasswordStrength(pw: string): { score: number; label: PasswordStrength; color: string } {
  let score = 0
  if (pw.length >= PASSWORD_RULES.minLength) score++
  if (pw.length >= 12)                       score++
  if (PASSWORD_RULES.hasUppercase.test(pw))  score++
  if (PASSWORD_RULES.hasLowercase.test(pw))  score++
  if (PASSWORD_RULES.hasNumber.test(pw))     score++
  if (PASSWORD_RULES.hasSpecial.test(pw))    score++

  if (score <= 1) return { score, label: 'weak',        color: '#EF4444' }
  if (score === 2) return { score, label: 'fair',        color: '#F97316' }
  if (score === 3) return { score, label: 'moderate',    color: '#EAB308' }
  if (score === 4) return { score, label: 'strong',      color: '#22C55E' }
  return              { score, label: 'very-strong', color: '#8B5CF6' }
}

// ── Reusable field definitions ────────────────────────────────────────────────

const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Enter a valid email address')
  .max(255, 'Email is too long')
  .toLowerCase()
  .trim()

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8,  'Password must be at least 8 characters')
  .max(128,'Password is too long')
  .regex(PASSWORD_RULES.hasUppercase, 'Password must contain at least one uppercase letter')
  .regex(PASSWORD_RULES.hasLowercase, 'Password must contain at least one lowercase letter')
  .regex(PASSWORD_RULES.hasNumber,    'Password must contain at least one number')

const phoneField = z
  .string()
  .regex(
    /^(\+92|0)[0-9]{10}$/,
    'Enter a valid Pakistani phone number (+923001234567 or 03001234567)'
  )
  .optional()
  .or(z.literal(''))

const nameField = (label = 'Name') =>
  z
    .string({ required_error: `${label} is required` })
    .min(2,  `${label} must be at least 2 characters`)
    .max(80, `${label} is too long`)
    .trim()

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name:            nameField('Name'),
    email:           emailField,
    password:        passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'BUSINESS_EXPERT'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }),
    phone: phoneField,
    city:  z.string().min(1, 'City is required').max(80).trim().optional(),
    yearsExperience: z.number().int().min(0).max(50).optional(),
    skills:          z.string().max(500).trim().optional(),
    expertSummary:   z.string().max(1000).trim().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })
  .superRefine((d, ctx) => {
    if (d.role !== 'BUSINESS_EXPERT') return
    if (d.yearsExperience == null || d.yearsExperience < 1) {
      ctx.addIssue({ code: 'custom', message: 'Enter at least 1 year of business experience', path: ['yearsExperience'] })
    }
    if (!d.skills || d.skills.trim().length < 5) {
      ctx.addIssue({ code: 'custom', message: 'Describe your business skills (at least 5 characters)', path: ['skills'] })
    }
  })

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'Password is required').max(128),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput    = z.infer<typeof loginSchema>

// ── Business schemas ──────────────────────────────────────────────────────────

const VALID_INDUSTRIES = [
  'TECHNOLOGY', 'RETAIL', 'MANUFACTURING', 'FOOD_BEVERAGE', 'REAL_ESTATE',
  'HEALTHCARE', 'EDUCATION', 'AGRICULTURE', 'TEXTILE', 'LOGISTICS',
  'HOSPITALITY', 'FINANCE', 'CONSTRUCTION', 'MEDIA', 'OTHER',
] as const

const VALID_PROVINCES = [
  'PUNJAB', 'SINDH', 'KPK', 'BALOCHISTAN', 'ISLAMABAD', 'AJK', 'GILGIT_BALTISTAN',
] as const

const VALID_STAGES = [
  'IDEA', 'STARTUP', 'GROWING', 'EXPANDING', 'MATURE',
] as const

const VALID_LISTING_TYPES = ['INVESTMENT', 'ACQUISITION', 'PARTNERSHIP'] as const

const positiveDecimal = z.number().positive('Must be a positive number').nullable().optional()
const positiveInt     = z.number().int().positive('Must be a positive integer').nullable().optional()
const imageUrlField = z.string().refine((value) => {
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return true

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}, 'Each image must be a valid image URL')

const MAX_VIDEO_DATA_URL_LEN = 28_000_000 // ~20 MB file as base64

const videoUrlField = z
  .string()
  .max(MAX_VIDEO_DATA_URL_LEN, 'Video file is too large (max 20 MB)')
  .refine((value) => {
    if (/^data:video\/(mp4|webm|quicktime|x-msvideo);base64,/i.test(value)) return true

    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Video must be a valid MP4, WebM, or MOV file')

export const createBusinessSchema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters').max(160).trim(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(10_000).trim(),
  industry:    z.enum(VALID_INDUSTRIES, { errorMap: () => ({ message: 'Invalid industry' }) }),
  city:        z.string().min(1, 'City is required').max(80).trim(),
  province:    z.enum(VALID_PROVINCES, { errorMap: () => ({ message: 'Invalid province' }) }),
  listingType: z.enum(VALID_LISTING_TYPES, { errorMap: () => ({ message: 'Invalid listing type' }) }),
  stage:       z.enum(VALID_STAGES, { errorMap: () => ({ message: 'Invalid business stage' }) }),
  askingPrice: positiveDecimal,
  revenue:     positiveDecimal,
  profit:      z.number().nullable().optional(),  // can be negative (loss-making)
  employees:   positiveInt,
  established: z
    .number()
    .int()
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .nullable()
    .optional(),
  highlights: z
    .array(z.string().max(120, 'Each highlight must be under 120 characters').trim())
    .max(6, 'Maximum 6 highlights')
    .default([]),
  imageUrls: z
    .array(imageUrlField)
    .max(5, 'Maximum 5 images')
    .default([]),
  videoUrl: videoUrlField.nullable().optional(),
  isRegistered:    z.boolean().default(false),
  seekingOperator: z.boolean().default(false),
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
})

export const updateBusinessSchema = createBusinessSchema
  .partial()
  .extend({
    status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  })

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>

// ── Connection request schema ─────────────────────────────────────────────────

export const connectionSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  message:    z
    .string()
    .min(30, 'Please write at least 30 characters to introduce yourself')
    .max(1000, 'Message is too long (max 1000 characters)')
    .trim(),
  type: z.enum(['INVESTMENT', 'BUYING']).optional(),
})

export type ConnectionInput = z.infer<typeof connectionSchema>

// ── Message schema ────────────────────────────────────────────────────────────

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long (max 2000 characters)')
    .trim(),
})

// ── Profile update schema ─────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name:      nameField().optional(),
  phone:     phoneField,
  city:      z.string().max(80).trim().optional().nullable(),
  bio:       z.string().max(500).trim().optional().nullable(),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password to confirm account deletion'),
})
