import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const RELAY_API = 'https://api.relay.link';
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const UINT_RE = /^[0-9]+$/;

export async function POST(request: NextRequest) {
  let input: any;
  try { input = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }

  const originChainId = Number(input?.originChainId);
  const destinationChainId = Number(input?.destinationChainId);
  const amount = String(input?.amount ?? '');
  if (!ADDRESS_RE.test(String(input?.user ?? '')) || !ADDRESS_RE.test(String(input?.originCurrency ?? '')) || !ADDRESS_RE.test(String(input?.destinationCurrency ?? ''))) {
    return NextResponse.json({ error: 'Wallet and token addresses must be valid EVM addresses.' }, { status: 400 });
  }
  if (!Number.isSafeInteger(originChainId) || originChainId <= 0 || !Number.isSafeInteger(destinationChainId) || destinationChainId <= 0) {
    return NextResponse.json({ error: 'Source and destination chain IDs must be valid.' }, { status: 400 });
  }
  if (!UINT_RE.test(amount) || BigInt(amount) <= 0n) return NextResponse.json({ error: 'Amount must be a positive integer in token base units.' }, { status: 400 });

  const payload = {
    user: input.user,
    originChainId,
    destinationChainId,
    originCurrency: input.originCurrency,
    destinationCurrency: input.destinationCurrency,
    amount,
    tradeType: 'EXACT_INPUT',
  };

  try {
    const upstream = await fetch(`${RELAY_API}/quote`, {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(20_000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message = typeof body?.message === 'string' ? body.message : typeof body?.error === 'string' ? body.error : 'Relay could not find a route for this request.';
      return NextResponse.json({ error: message }, { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 });
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Relay quote service timed out or is unavailable. Please retry.' }, { status: 502 });
  }
}
