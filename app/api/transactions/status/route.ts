import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = () => {
  const key = SUPABASE_SERVICE_ROLE_KEY!;
  const result: Record<string, string> = {
    apikey: key,
    'Content-Type': 'application/json',
  };
  if (!key.startsWith('sb_secret_')) result.Authorization = `Bearer ${key}`;
  return result;
};

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Transaction history is not configured.' }, { status: 503 });
  }
  let input: any;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const txHash = String(input?.txHash ?? '');
  const chainId = Number(input?.chainId);
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash) || !Number.isSafeInteger(chainId)) {
    return NextResponse.json({ error: 'Invalid transaction hash or chain ID.' }, { status: 400 });
  }
  // Check source-chain receipt through a public RPC when available; do not infer destination completion from source confirmation.
  const RPCS: Record<number, string> = {
    1: 'https://ethereum-rpc.publicnode.com',
    8453: 'https://mainnet.base.org',
    42161: 'https://arb1.arbitrum.io/rpc',
    10: 'https://mainnet.optimism.io',
    137: 'https://polygon-bor-rpc.publicnode.com',
    56: 'https://bsc-rpc.publicnode.com',
    43114: 'https://avalanche-c-chain-rpc.publicnode.com',
    7777777: 'https://rpc.zora.energy',
  };
  const rpc = RPCS[chainId];
  if (!rpc) return NextResponse.json({ status: 'submitted', detail: 'No public RPC configured for this chain.' });
  try {
    const response = await fetch(rpc, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] }),
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    const data = await response.json().catch(() => null);
    const receipt = data?.result;
    if (!receipt) return NextResponse.json({ status: 'pending', detail: 'Waiting for source-chain confirmation.' });
    const status = receipt.status === '0x1' ? 'confirmed' : receipt.status === '0x0' ? 'failed' : 'submitted';
    return NextResponse.json({
      status,
      blockNumber: receipt.blockNumber ?? null,
      detail: status === 'confirmed'
        ? 'Source-chain transaction confirmed. Cross-chain destination settlement may still be processing.'
        : status === 'failed' ? 'Source-chain transaction reverted.' : 'Transaction submitted.',
    });
  } catch {
    return NextResponse.json({ status: 'submitted', detail: 'Could not verify the transaction right now.' });
  }
}
