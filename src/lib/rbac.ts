/**
 * Role-Based Access Control
 *
 * Central definition of which roles can access which routes.
 * Used by both the Next.js middleware and server components.
 */

import { getRoleRedirect } from './constants'

export type AppRole = 'BUSINESS_OWNER' | 'INVESTOR' | 'BUYER' | 'BUSINESS_EXPERT' | 'ADMIN'

// ─────────────────────────────────────────────────────────────
// Route permission table
// Order matters: first matching rule wins.
// ─────────────────────────────────────────────────────────────

interface RouteRule {
  /** Regex pattern tested against `pathname` */
  pattern: RegExp
  /** Roles that may access this route */
  roles:   AppRole[]
}

export const ROUTE_RULES: RouteRule[] = [
  // Admin area — admin only
  { pattern: /^\/admin/,               roles: ['ADMIN'] },

  // Role-specific dashboards
  { pattern: /^\/dashboard\/business/, roles: ['BUSINESS_OWNER', 'ADMIN'] },
  { pattern: /^\/dashboard\/investor/, roles: ['INVESTOR', 'ADMIN'] },
  { pattern: /^\/dashboard\/buyer/,    roles: ['BUYER', 'ADMIN'] },
  { pattern: /^\/dashboard\/expert/,   roles: ['BUSINESS_EXPERT', 'ADMIN'] },

  // Generic dashboard — any authenticated user
  { pattern: /^\/dashboard/,           roles: ['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'BUSINESS_EXPERT', 'ADMIN'] },

  // Feature routes — any authenticated user
  { pattern: /^\/messages/,            roles: ['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'BUSINESS_EXPERT', 'ADMIN'] },
  { pattern: /^\/profile/,             roles: ['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'BUSINESS_EXPERT', 'ADMIN'] },

  // Listing creation — owners only
  { pattern: /^\/listings\/new/,       roles: ['BUSINESS_OWNER', 'ADMIN'] },
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if `role` is allowed to access `pathname`.
 * Returns true for public routes (no matching rule).
 */
export function canAccess(pathname: string, role: string): boolean {
  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(pathname)) {
      return (rule.roles as string[]).includes(role)
    }
  }
  return true // public route
}

/**
 * Returns true if `pathname` matches ANY protected rule.
 * Used by middleware to decide whether to check the token at all.
 */
export function isProtectedPath(pathname: string): boolean {
  return ROUTE_RULES.some((r) => r.pattern.test(pathname))
}

/**
 * Returns the set of roles allowed for a given path, or null if public.
 */
export function getAllowedRoles(pathname: string): AppRole[] | null {
  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(pathname)) return rule.roles
  }
  return null
}

export { getRoleRedirect }
