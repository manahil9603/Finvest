/**
 * Server-side input sanitization.
 *
 * Never trust client-provided strings in API handlers.
 * All text saved to the database should pass through one of these functions.
 */

// ── Core strip ────────────────────────────────────────────────────────────────

/** Remove characters that have no place in a text field */
function strip(raw: string): string {
  return (
    raw
      .replace(/\0/g, '')                   // null bytes (poison input)
      .replace(/\r\n/g, '\n')               // CRLF → LF
      .replace(/\r/g, '\n')                 // CR   → LF
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // control chars (not \n, \t)
      .trim()
  )
}

/** Escape characters that could be interpreted as HTML */
const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c)
}

/** Strip all HTML tags (for plain-text fields) */
function stripTags(s: string): string {
  // Remove script content first (belt-and-suspenders — tags are stripped next)
  return s
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')            // any remaining tags
    .replace(/javascript:/gi, '')       // javascript: URIs
    .replace(/data:/gi, '')             // data: URIs
    .replace(/vbscript:/gi, '')
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sanitize a **plain-text** field (name, city, highlights, etc.).
 * Strips all HTML and limits length.
 */
export function sanitizeText(raw: string, maxLength = 2000): string {
  return escapeHtml(stripTags(strip(raw))).slice(0, maxLength)
}

/**
 * Sanitize a **rich text / description** field that may contain
 * newlines but must never contain HTML or scripts.
 */
export function sanitizeRichText(raw: string, maxLength = 10_000): string {
  return stripTags(strip(raw)).slice(0, maxLength)
}

/**
 * Sanitize a **short identifier** field (username, city, phone).
 * Single-line, no HTML, limited characters.
 */
export function sanitizeShort(raw: string, maxLength = 120): string {
  return escapeHtml(
    strip(raw)
      .replace(/\n/g, ' ')   // collapse newlines
      .replace(/\s{2,}/g, ' ')
  ).slice(0, maxLength)
}

/**
 * Sanitize a **URL** field — only http/https allowed.
 * Returns null if the URL is unsafe or malformed.
 */
export function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize an array of strings (highlights, tags, etc.).
 * Deduplicates, strips HTML, limits per-entry length and array length.
 */
export function sanitizeStringArray(
  raw: string[],
  { maxItems = 10, maxItemLen = 200 }: { maxItems?: number; maxItemLen?: number } = {}
): string[] {
  const seen = new Set<string>()
  return raw
    .map((s) => sanitizeText(s, maxItemLen))
    .filter((s) => {
      if (!s || seen.has(s)) return false
      seen.add(s)
      return true
    })
    .slice(0, maxItems)
}

/**
 * Sanitize a **message / chat content** field.
 * Preserves newlines for readability; strips HTML and scripts.
 */
export function sanitizeMessage(raw: string, maxLength = 2000): string {
  return stripTags(strip(raw)).slice(0, maxLength)
}
