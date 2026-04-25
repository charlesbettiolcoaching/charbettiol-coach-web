// Serves Mission Control HTML with an in-route auth gate.
// Auth is enforced HERE rather than relying on middleware — Vercel's
// route-level optimisations meant our middleware wasn't applying.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const ALLOWED_EMAILS = new Set<string>([
  'charlesbettiolbusiness@gmail.com',
  'charlesbettiolcoaching@gmail.com',
]);

const HTML = readFileSync(
  join(process.cwd(), 'src/data/mission-control.html'),
  'utf-8',
);

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* no-op — read-only gate */ },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL('/login?redirect=/mission-control', req.url);
    return NextResponse.redirect(url);
  }
  if (!ALLOWED_EMAILS.has(user.email ?? '')) {
    return new NextResponse('Not authorised', { status: 403 });
  }

  return new Response(HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
