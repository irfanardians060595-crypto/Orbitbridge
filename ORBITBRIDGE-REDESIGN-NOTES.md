# OrbitBridge redesign — applied specification

## Landing page
- Dark monochrome styling: black background, white/gray text, charcoal surfaces, and subtle gray borders.
- Uses the transparent OrbitBridge emblem at `/public/orbitbridge-emblem.png` in the header, footer, and cinematic intro.
- Cinematic intro remains: dark opening, orbital logo reveal, OrbitBridge wordmark, then transition to the site.
- Global orbit field remains behind content; monochrome orbit particles and rings animate subtly.
- Font direction uses Space Grotesk for display/interface text, Inter fallback, and IBM Plex Mono for technical labels.
- Adds a moving monochrome ecosystem strip directly after the header.
- Adds a Buy OrbitBridge Token banner after the moving strip and before the “Made to Move” hero. It displays COMING SOON until both the contract address and purchase URL are configured.
- Hero copy: “Made to Move”, “Swap & Bridge”, and “One Click Simple and Rewards”.
- Removes the entire “HOW ORBITBRIDGE WORKS” section and the entire “TRANSPARENCY & SECURITY” section from the landing page.
- Adds “Buy Token” to the navigation, pointing to the banner.

## Token purchase configuration
Edit `config/contract.ts` only when official details are ready:
- `CONTRACT_ADDRESS`: official token contract address.
- `BUY_TOKEN_URL`: verified purchase route for the correct chain/DEX.
The button remains disabled/COMING SOON unless both values are set. A contract address alone does not identify a safe/working purchase route. Wallet connection must remain user-initiated; the site must not silently connect or initiate transactions.

## Mobile
- Responsive overrides address header/nav/wallet width, hero sizing, swap form fields, token/network selectors, modal stacking, buy banner, and footer layout.
- Motion is reduced when the visitor prefers reduced motion.

## Existing application functionality
The changes avoid modifying Relay quote/execute logic, wallet provider, API routes, swap/bridge flow, or transaction history.

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Verification
The source archive was inspected and modified. A full dependency install/build could not be completed in this environment because `npm ci` timed out. Please run `npm install` and `npm run build` locally before deployment. Keep the previous source folder as a backup.


## Latest user-requested revision
- Relocated the Buy OrbitBridge Token banner from directly below the header/marquee to immediately above the `MADE TO MOVE` feature section (`Cross-chain, minus the complication.`).
- Buy Token now always opens the Uniswap swap page (`https://app.uniswap.org/swap`) in a new tab. It no longer depends on the contract address or a configured purchase URL just to be clickable. This opens Uniswap generally; it does not preselect a specific token because no official token contract address has been provided.
- Changed the swap card heading from `Swap anything.` to `Swap & Bridge Anything.`
- Existing removal of `HOW ORBITBRIDGE WORKS` and `TRANSPARENCY & SECURITY` sections is preserved.
