# OrbitBridge — Cross-chain Swap & Bridge

OrbitBridge is an independent interface for exploring swap and cross-chain bridge routes using Relay's public infrastructure. It is not the official Relay website and does not custody user funds.

## Stack

- Next.js App Router + React + TypeScript
- Custom responsive CSS interface
- RainbowKit + wagmi for wallet connection
- Server-side Next.js route handlers that proxy Relay chain, currency, and quote requests

## Run locally

Requirements: Node.js 20.9+ (recommended current LTS) and npm.

```bash
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment

- `NEXT_PUBLIC_APP_URL`: public app URL; currently informational.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: create a project in WalletConnect Cloud. The placeholder is not a valid project ID, so WalletConnect-powered connections will not work until configured.

No private key, seed phrase, or signing secret belongs in this project or in environment variables. Transactions are signed in the user's wallet.

## Relay API routes

- `GET /api/relay/chains` — chain directory proxy.
- `GET /api/relay/currencies?chainId=<id>` — token directory proxy with chain ID validation.
- `POST /api/relay/quote` — validates the request and proxies a quote request to `https://api.relay.link/quote`.

These server routes improve validation and centralize upstream access, but are not a substitute for production rate limiting, abuse monitoring, and provider-specific policy review.

## Important production checklist

This is a development starter, not a production-audited financial application. Do not use it with funds until all of the following are completed and tested:

1. Verify current Relay request/response schemas and integration requirements against [Relay Developer Docs](https://docs.relay.link/).
2. Replace any manual execution logic with the currently recommended Relay SDK execution flow. Relay routes can contain multiple steps, approvals, and cross-chain completion actions; a simplistic loop is not sufficient to safely cover every route type.
3. Implement transaction status polling using Relay's supported status API and show pending, completed, and failed states accurately.
4. Add balance-aware MAX, slippage/route preferences, quote expiry handling, token safety information, and robust chain switching.
5. Configure WalletConnect Project ID and test injected wallets and WalletConnect on mobile and desktop.
6. Add API rate limiting, structured server logs, error monitoring, analytics/privacy disclosures, terms, and a security review.
7. Test every supported chain and transaction path on a safe test plan before mainnet launch.
8. Review Relay's current terms, integrator requirements, branding guidance, and fee/revenue options.

Relay determines which chains, assets, routes, fees, and execution steps are available. OrbitBridge does not guarantee a route or settlement time. Always inspect wallet prompts and transaction details before signing.


## OrbitBridge transaction history patch

The `/transactions` page now reads recorded activity from a Supabase-backed table. Swap and bridge pages submit each wallet transaction hash to the server-side `/api/transactions` route after the wallet returns a hash. The page refreshes every 20 seconds and checks source-chain receipts through public RPCs.

### Required setup before deploying

1. Create a Supabase project.
2. In its SQL Editor, run `supabase-orbitbridge-transactions.sql` from this patch.
3. In Vercel > Project > Settings > Environment Variables, add:
   - `SUPABASE_URL` — the Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the server-side Supabase key. A legacy `service_role` JWT or a new `sb_secret_...` key is accepted. Keep it secret and server-side; never use a `NEXT_PUBLIC_` prefix.
4. Add the same variables to local `.env.local` if running locally, then redeploy Vercel.
5. Test with a small transaction and verify that its hash appears in `/transactions`.

### What the status means

- `Submitted`: OrbitBridge received a transaction hash from the connected wallet.
- `Pending`: the configured source-chain RPC does not yet return a receipt.
- `Source confirmed`: the source-chain transaction receipt succeeded.
- `Failed`: the source-chain receipt reports a revert.

A source-chain confirmation is **not** proof that a cross-chain bridge has completed on its destination chain. Destination settlement tracking must use Relay's current supported status mechanism and be verified separately. The current patch deliberately does not label a bridge as fully completed without that evidence.

This is a starter implementation and should be tested against the exact production deployment and supported chains before relying on it for financial decisions. The public activity feed only contains transactions submitted after this patch is deployed and saved successfully; it cannot automatically reconstruct historical transactions.


## Troubleshooting transaction history

- Restart `npm run dev` after changing `.env.local`; Next.js reads environment variables when the server starts.
- `SUPABASE_URL` must be the project's URL (for example `https://<project-ref>.supabase.co`), not the dashboard URL.
- `SUPABASE_SERVICE_ROLE_KEY` must be a server-side service-role/secret key, not an anon/publishable key.
- New `sb_secret_...` keys are sent as the Supabase `apikey` header only; legacy service-role JWTs are also sent as `Authorization: Bearer ...`.
- If `/api/transactions` returns 502 in development, inspect the Next.js terminal for the logged Supabase status and error response. Never share the secret key or commit `.env.local`.
