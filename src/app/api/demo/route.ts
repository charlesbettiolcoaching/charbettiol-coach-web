export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUrl = new URL('/clients', url.origin)
  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set('demo_mode', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24,
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
