import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const RELAY_API = 'https://api.relay.link';

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('chainId');
  const chainId = Number(raw);
  if (!raw || !Number.isSafeInteger(chainId) || chainId <= 0) {
    return NextResponse.json({ error: 'A valid chainId is required.' }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${RELAY_API}/currencies/v2?chainId=${chainId}`, {
      headers: { accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(12_000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) return NextResponse.json({ error: 'Token list is temporarily unavailable.' }, { status: 502 });
    const currencies = Array.isArray(body) ? body : body?.currencies ?? body?.tokens;
    if (!Array.isArray(currencies)) return NextResponse.json({ error: 'Relay returned an unexpected token response.' }, { status: 502 });
    return NextResponse.json(currencies.filter((token: any) => Number(token?.chainId) === chainId && typeof token?.address === 'string' && typeof token?.symbol === 'string' && Number.isInteger(Number(token?.decimals))), {
      headers: { 'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=90' },
    });
  } catch {
    return NextResponse.json({ error: 'Could not load tokens for this network. Please retry.' }, { status: 502 });
  }
}
