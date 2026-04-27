/**
 * API key primitives — generate, hash, lookup.
 *
 * Key format: `prk_live_<32 random base62 chars>`. Prefix (first 14 chars)
 * is stored for display; only the sha256 of the full key lives in the DB.
 *
 * Keys are authenticated against incoming requests by hashing the presented
 * `Authorization: Bearer prk_live_…` value and matching it against the hash
 * column. See `validateApiKey()` below.
 */

import { createHash, randomBytes } from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const KEY_BODY_LEN = 32
const KEY_PREFIX = 'prk_live_'

export function generateApiKey(): { plain: string; prefix: string; hash: string } {
  const bytes = randomBytes(KEY_BODY_LEN)
  let body = ''
  for (let i = 0; i < KEY_BODY_LEN; i++) {
    body += ALPHABET[bytes[i] % ALPHABET.length]
  }
  const plain = `${KEY_PREFIX}${body}`
  const prefix = plain.slice(0, 14)  // "prk_live_AAAAA" — enough to tell keys apart in UI
  const hash = hashApiKey(plain)
  return { plain, prefix, hash }
}

export function hashApiKey(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}

export interface ApiKeyAuthResult {
  ok: boolean
  coachId?: string
  keyId?: string
  reason?: string
}

/**
 * Validates a bearer token against the api_keys table using the service-role
 * Supabase client (so we bypass RLS — the key lookup itself is the auth).
 * Returns the owning coach_id on success.
 *
 * Side effects: updates last_used_at on match (best-effort, non-blocking).
 */
export async function validateApiKey(
  presentedKey: string,
  adminSupabase: any,
): Promise<ApiKeyAuthResult> {
  if (!presentedKey.startsWith(KEY_PREFIX)) {
    return { ok: false, reason: 'bad_prefix' }
  }
  const hash = hashApiKey(presentedKey)

  const { data: row, error } = await adminSupabase
    .from('api_keys')
    .select('id, coach_id, revoked_at, expires_at')
    .eq('key_hash', hash)
    .maybeSingle()

  if (error || !row) return { ok: false, reason: 'not_found' }
  if (row.revoked_at) return { ok: false, reason: 'revoked' }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' }
  }

  // Non-blocking last-used bump
  adminSupabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => undefined, () => undefined)

  return { ok: true, coachId: row.coach_id, keyId: row.id }
}
