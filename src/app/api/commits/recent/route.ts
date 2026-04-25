// Feeds Mission Control with recent git commits across all Propel repos.
// CORS open (origin: '*') because Mission Control is served as a local
// HTML file from outside this app's domain.
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ commits: [] }, { headers: corsHeaders });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const repo = searchParams.get('repo');

  const qs = new URLSearchParams();
  qs.set('select', '*');
  qs.set('order', 'created_at.desc');
  qs.set('limit', String(limit));
  if (repo) qs.set('repo', `eq.${repo}`);

  const res = await fetch(`${url}/rest/v1/commit_events?${qs.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json(
      { commits: [], error: `supabase ${res.status}` },
      { status: 502, headers: corsHeaders },
    );
  }

  const commits = await res.json();
  return NextResponse.json({ commits }, { headers: corsHeaders });
}
