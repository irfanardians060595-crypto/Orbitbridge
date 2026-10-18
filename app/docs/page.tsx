'use client';
import Link from 'next/link';
import { ArrowLeftRight, ArrowUpRight, ShieldCheck, Network } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import WalletProvider from '@/components/WalletProvider';

function DocsContent() {
  return <main className="site-shell">
    <header className="topbar"><Link className="brand" href="/" aria-label="OrbitBridge home"><img className="brand-logo" src="/orbitbridge-emblem.png" alt="" aria-hidden="true"/><span>OrbitBridge</span></Link>
      <nav className="nav-links"><Link href="/swap">Swap</Link><Link href="/bridge">Bridge</Link><Link href="/#networks">Networks</Link><Link href="/transactions">Transactions</Link><Link className="nav-active" href="/docs">Docs <ArrowUpRight size={13}/></Link><a className="header-social" href="https://x.com/" target="_blank" rel="noreferrer" aria-label="OrbitBridge on X">𝕏</a></nav><div className="top-actions"><ConnectButton showBalance={false}/></div>
    </header>
    <section className="docs-page">
      <div className="docs-hero"><span className="eyebrow">ORBITBRIDGE / DOCUMENTATION</span><h1>Move value.<br/><em>Know your route.</em></h1><p>Quick guidance for using OrbitBridge to explore cross-chain routes, review transaction details, and keep control of wallet approvals.</p></div>
      <div className="docs-grid">
        <article className="docs-card"><div className="docs-card-icon"><ArrowLeftRight size={20}/></div><h2>Swap and bridge</h2><p>Choose the Swap or Bridge mode in the transaction panel, select the network and asset you are sending from, then choose the destination network and asset.</p></article>
        <article className="docs-card"><div className="docs-card-icon"><Network size={20}/></div><h2>Networks and assets</h2><p>Use the network selectors to choose supported chains. Available assets depend on the selected network and the route data returned by Relay.</p></article>
        <article className="docs-card"><div className="docs-card-icon"><ShieldCheck size={20}/></div><h2>Review before approval</h2><p>Connect your wallet, enter an amount, and select <strong>Review route</strong>. Check the quote, destination, fees, and all wallet prompts before approving or signing.</p></article>
        <article className="docs-card"><div className="docs-card-icon"><ShieldCheck size={20}/></div><h2>Wallet safety</h2><p>OrbitBridge should never ask for your seed phrase or private key. Only approve transactions you understand and confirm the network and token details in your wallet.</p></article>
      </div>
      <div className="docs-note">OrbitBridge is an interface powered by Relay routing infrastructure. Route availability, supported assets, estimated output, and fees can vary. Always verify the transaction details shown in your wallet before confirming.</div>
    </section>
    <footer className="footer"><Link className="brand footer-brand" href="/"><img className="brand-logo" src="/orbitbridge-emblem.png" alt="" aria-hidden="true"/><span>OrbitBridge</span></Link><span>Swap &amp; Bridge. <span className="footer-muted">One Click Simple and Rewards.</span></span><div className="footer-links"><Link href="/swap">Swap</Link><Link href="/transactions">Transactions</Link><a href="https://relay.link/" target="_blank" rel="noreferrer">Relay <ArrowUpRight size={12}/></a><Link href="/docs">OrbitBridge Docs <ArrowUpRight size={12}/></Link></div><span className="copyright">© 2026 OrbitBridge</span></footer>
  </main>;
}

export default function DocsPage() { return <WalletProvider><DocsContent /></WalletProvider>; }
