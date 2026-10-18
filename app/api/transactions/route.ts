import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function configMissing() {
  return !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY;
}
function supabaseHeaders(extra: Record<string, string> = {}) {
  const key = SUPABASE_SERVICE_ROLE_KEY!;
  const headers: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
    ...extra,
  };

  // Legacy service_role keys are JWTs and can be sent as Bearer tokens.
  // New Supabase secret keys (sb_secret_...) are not JWTs; sending them in
  // Authorization can cause PostgREST JWT validation errors. Use them as apikey.
  if (!key.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}
function unavailable() {
  return NextResponse.json({
    error: 'Transaction history is not configured yet. Set up Supabase and add the server environment variables.',
  }, { status: 503 });
}

export async function GET(request: NextRequest) {
  if (configMissing()) return unavailable();
  const wallet = request.nextUrl.searchParams.get('wallet');
  const search = request.nextUrl.searchParams.get('search');
  const params = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: '100',
  });
  if (wallet && ADDRESS_RE.test(wallet)) params.set('wallet', `eq.${wallet.toLowerCase()}`);
  if (search && HASH_RE.test(search)) params.set('tx_hash', `eq.${search}`);
  else if (search && ADDRESS_RE.test(search)) params.set('wallet', `eq.${search.toLowerCase()}`);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/gamgam_transactions?${params.toString()}`, {
      headers: supabaseHeaders(), cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = typeof data === 'string' ? data : JSON.stringify(data);
      console.error('[transactions] Supabase GET failed:', response.status, detail?.slice(0, 1200));
      const message = process.env.NODE_ENV === 'development'
        ? `Could not load transaction history (Supabase ${response.status}). Check the server terminal for details.`
        : 'Could not load transaction history.';
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json({ transactions: Array.isArray(data) ? data : [] }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('[transactions] Supabase GET request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Transaction history service is unavailable.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (configMissing()) return unavailable();
  let input: any;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const wallet = String(input?.wallet ?? '').toLowerCase();
  const txHash = String(input?.txHash ?? '');
  const chainId = Number(input?.chainId);
  const destinationChainId = Number(input?.destinationChainId);
  if (!ADDRESS_RE.test(wallet) || !HASH_RE.test(txHash)) {
    return NextResponse.json({ error: 'Valid wallet and transaction hash are required.' }, { status: 400 });
  }
  if (!Number.isSafeInteger(chainId) || chainId <= 0 || !Number.isSafeInteger(destinationChainId) || destinationChainId <= 0) {
    return NextResponse.json({ error: 'Valid chain IDs are required.' }, { status: 400 });
  }
  const allowed = (value: unknown, max = 80) => typeof value === 'string' ? value.slice(0, max) : '';
  const row = {
    wallet,
    tx_hash: txHash,
    operation_id: allowed(input?.operationId, 80) || null,
    kind: input?.kind === 'bridge' ? 'bridge' : 'swap',
    from_chain_id: chainId,
    to_chain_id: destinationChainId,
    from_chain: allowed(input?.fromChain, 80) || `Chain ${chainId}`,
    to_chain: allowed(input?.toChain, 80) || `Chain ${destinationChainId}`,
    from_token: allowed(input?.fromToken, 40),
    to_token: allowed(input?.toToken, 40),
    amount: allowed(input?.amount, 100),
    relay_request_id: allowed(input?.relayRequestId, 160) || null,
    status: 'submitted',
    created_at: new Date().toISOString(),
  };
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/gamgam_transactions?on_conflict=tx_hash`, {
      method: 'POST',
      headers: supabaseHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(row), cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[transactions] Supabase POST failed:', response.status, detail.slice(0, 1200));
      const message = process.env.NODE_ENV === 'development'
        ? `Could not save transaction (Supabase ${response.status}). Check the server terminal for details.`
        : 'Could not save transaction. Check the Supabase table setup.';
      return NextResponse.json({ error: message }, { status: 502 });
    }
    const data = await response.json().catch(() => []);
    return NextResponse.json({ transaction: Array.isArray(data) ? data[0] : data }, { status: 201 });
  } catch (error) {
    console.error('[transactions] Supabase POST request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Transaction storage service is unavailable.' }, { status: 502 });
  }
}
