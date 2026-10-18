import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const RELAY_API = 'https://api.relay.link';

export async function GET() {
  try {
    const upstream = await fetch(`${RELAY_API}/chains`, {
      headers: { accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12_000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) return NextResponse.json({ error: 'Network directory is temporarily unavailable.' }, { status: 502 });
    const chains = Array.isArray(body) ? body : body?.chains;
    if (!Array.isArray(chains)) return NextResponse.json({ error: 'Relay returned an unexpected network response.' }, { status: 502 });
    return NextResponse.json(chains, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
  } catch {
    return NextResponse.json({ error: 'Could not reach the network directory. Please retry.' }, { status: 502 });
  }
}
