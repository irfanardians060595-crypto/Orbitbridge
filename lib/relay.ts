export const RELAY_API = 'https://api.relay.link';

export type Chain = {
  id: number;
  name: string;
  displayName?: string;
  currency?: { symbol?: string };
  iconUrl?: string;
};

export type Currency = {
  chainId: number;
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  metadata?: { logoURI?: string; logoUrl?: string };
};

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { accept: 'application/json', ...init?.headers }, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : typeof body?.message === 'string' ? body.message : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function getChains(): Promise<Chain[]> {
  const data: any = await readJson('/api/relay/chains');
  const list = Array.isArray(data) ? data : data?.chains ?? [];
  return list.filter((c: any) => Number.isInteger(Number(c?.id)) && (c?.name || c?.displayName))
    .map((c: any) => ({ ...c, id: Number(c.id), name: c.displayName || c.name }));
}

export async function getCurrencies(chainId: number): Promise<Currency[]> {
  const data: any = await readJson(`/api/relay/currencies?chainId=${encodeURIComponent(chainId)}`);
  const list = Array.isArray(data) ? data : data?.currencies ?? data?.tokens ?? [];
  return list.filter((c: any) => Number(c?.chainId) === chainId && typeof c?.address === 'string' && c?.symbol && Number.isInteger(Number(c?.decimals)))
    .slice(0, 500).map((c: any) => ({ ...c, chainId, decimals: Number(c.decimals) }));
}

export async function getQuote(input: {
  user: string; originChainId: number; destinationChainId: number;
  originCurrency: string; destinationCurrency: string; amount: string;
}) {
  return readJson<any>('/api/relay/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...input, tradeType: 'EXACT_INPUT' }),
  });
}
