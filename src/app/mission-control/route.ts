// Serves Mission Control HTML behind the middleware auth gate.
// The HTML deliberately lives outside /public so Vercel's CDN doesn't
// hand it out before middleware runs.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HTML = readFileSync(
  join(process.cwd(), 'src/data/mission-control.html'),
  'utf-8',
);

export async function GET() {
  return new Response(HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
