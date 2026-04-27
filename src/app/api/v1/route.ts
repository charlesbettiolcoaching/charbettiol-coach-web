export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'

/**
 * GET /api/v1 — discover available endpoints and confirm auth.
 * Also serves as a health-check: if this returns 200, your API key works.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req)
  if ('error' in auth) return auth.error

  return NextResponse.json({
    api: 'propel-coaches',
    version: 'v1',
    authenticated_coach: auth.coachId,
    endpoints: [
      { method: 'GET', path: '/api/v1', description: 'This index.' },
      { method: 'GET', path: '/api/v1/clients', description: 'List your clients (query: limit, offset, search).' },
      { method: 'GET', path: '/api/v1/clients/:id', description: 'Fetch one client by id.' },
    ],
    notes: [
      'Authenticate with: Authorization: Bearer prk_live_<your-key>',
      'Rate limits: 120 req/min per key (enforced at the edge).',
      'More endpoints (programs, messages, check-ins) are on the roadmap.',
    ],
  })
}
