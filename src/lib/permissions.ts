/**
 * Central permission helpers.
 *
 * Import these instead of writing ad-hoc role checks in route handlers.
 * Every ownership / role decision lives here, making auditing straightforward.
 */

import { NextResponse } from 'next/server'
import type { JWTPayload } from './auth'

// ── Role predicates ───────────────────────────────────────────────────────────

export const isAdmin         = (role: string) => role === 'ADMIN'
export const isBusinessOwner = (role: string) => role === 'BUSINESS_OWNER' || role === 'ADMIN'
export const canInvest       = (role: string) => ['INVESTOR', 'BUYER', 'ADMIN'].includes(role)
export const isVerifiedRole  = (role: string) => ['BUSINESS_OWNER', 'INVESTOR', 'BUYER', 'ADMIN'].includes(role)

// ── Resource ownership ────────────────────────────────────────────────────────

/** Returns true if `userId` owns the resource or is an admin. */
export function canModify(userId: string, role: string, ownerId: string): boolean {
  return userId === ownerId || isAdmin(role)
}

/** Throw-style guard used in route handlers. */
export function assertOwnership(
  auth: JWTPayload,
  ownerId: string,
  resource = 'resource'
): NextResponse | null {
  if (!canModify(auth.userId, auth.role, ownerId)) {
    return NextResponse.json(
      { error: `Forbidden: you do not own this ${resource}.` },
      { status: 403 }
    )
  }
  return null
}

// ── Standard JSON responses ───────────────────────────────────────────────────

export function unauthorizedJson(message = 'Authentication required.') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenJson(message = 'You do not have permission to perform this action.') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFoundJson(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found.` }, { status: 404 })
}

export function badRequestJson(message: string, field?: string) {
  return NextResponse.json({ error: message, ...(field ? { field } : {}) }, { status: 400 })
}

export function conflictJson(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

// ── Route guard helper ────────────────────────────────────────────────────────

/**
 * Require an authenticated user with one of the specified roles.
 * Returns the payload if allowed, or a NextResponse error if not.
 *
 * @example
 * const [auth, err] = requireRole(req, ['ADMIN'])
 * if (err) return err
 */
export function requireRole(
  auth: JWTPayload | null,
  roles: string[]
): [JWTPayload, null] | [null, NextResponse] {
  if (!auth)                       return [null, unauthorizedJson()]
  if (!roles.includes(auth.role))  return [null, forbiddenJson()]
  return [auth, null]
}

/**
 * Require authentication (any role).
 */
export function requireAuth(
  auth: JWTPayload | null
): [JWTPayload, null] | [null, NextResponse] {
  if (!auth) return [null, unauthorizedJson()]
  return [auth, null]
}
