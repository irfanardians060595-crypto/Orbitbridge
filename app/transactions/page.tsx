'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowUpRight, Search, ArrowRightLeft, Clock3, RefreshCw, ExternalLink, UserRound, Globe2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import WalletProvider from '@/components/WalletProvider';

type Tx = {
 id?: number; wallet: string; tx_hash: string; operation_id?: string | null; kind: 'swap'|'bridge';
 from_chain_id: number; to_chain_id: number; from_chain: string; to_chain: string;
 from_token?: string; to_token?: string; amount?: string; status?: string; created_at: string;
};
type LiveStatus = { status: string; detail?: string; blockNumber?: string | null };
const explorer: Record<number,string> = {
 1:'https://etherscan.io/tx/',8453:'https://basescan.org/tx/',42161:'https://arbiscan.io/tx/',
 10:'https://optimistic.etherscan.io/tx/',137:'https://polygonscan.com/tx/',56:'https://bscscan.com/tx/',
 43114:'https://snowtrace.io/tx/',7777777:'https://explorer.zora.energy/tx/'
};
function short(value?: string){return value?`${value.slice(0,6)}…${value.slice(-4)}`:'—'}
function TransactionsContent(){
 const {address,isConnected}=useAccount();
 const [transactions,setTransactions]=useState<Tx[]>([]);
 const [statuses,setStatuses]=useState<Record<string,LiveStatus>>({});
 const [search,setSearch]=useState('');
 const [from,setFrom]=useState('All Chains');
 const [to,setTo]=useState('All Chains');
 const [mode,setMode]=useState<'all'|'mine'>('all');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [lastUpdated,setLastUpdated]=useState<Date|null>(null);
 const refresh=useCallback(async()=>{
  setError('');
  try{
   const query=new URLSearchParams();
   if(mode==='mine'&&address)query.set('wallet',address);
   const response=await fetch(`/api/transactions?${query.toString()}`,{cache:'no-store'});
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body?.error||'Could not load transactions.');
   const rows:Array<Tx>=Array.isArray(body.transactions)?body.transactions:[];
   setTransactions(rows);
   setLastUpdated(new Date());
   const next:Record<string,LiveStatus>={};
   await Promise.all(rows.slice(0,30).map(async tx=>{
    try{
     const res=await fetch('/api/transactions/status',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({txHash:tx.tx_hash,chainId:tx.from_chain_id})});
     const data=await res.json();
     if(res.ok)next[tx.tx_hash]=data;
    }catch{}
   }));
   setStatuses(prev=>({...prev,...next}));
  }catch(e:any){setError(e?.message||'Transaction history is unavailable.');}
  finally{setLoading(false);}
 },[address,mode]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),20000);return()=>clearInterval(timer)},[refresh]);
 const chains=useMemo(()=>['All Chains',...Array.from(new Set(transactions.flatMap(t=>[t.from_chain,t.to_chain]))).sort()], [transactions]);
 const filtered=useMemo(()=>transactions.filter(tx=>{
  const q=search.trim().toLowerCase();
  const matchSearch=!q||[tx.wallet,tx.tx_hash,tx.from_chain,tx.to_chain,tx.from_token,tx.to_token,tx.kind].some(v=>(v||'').toLowerCase().includes(q));
  return matchSearch&&(from==='All Chains'||tx.from_chain===from)&&(to==='All Chains'||tx.to_chain===to);
 }),[transactions,search,from,to]);
 const statusLabel=(tx:Tx)=>{
  const status=statuses[tx.tx_hash]?.status||tx.status||'submitted';
  if(status==='confirmed')return 'Source confirmed';
  if(status==='failed')return 'Failed';
  if(status==='pending')return 'Pending';
  return 'Submitted';
 };
 return <main className="site-shell transactions-page">
  <header className="topbar"><Link className="brand" href="/"><img className="brand-logo" src="/orbitbridge-emblem.png" alt="" aria-hidden="true"/><span>OrbitBridge</span></Link><nav className="nav-links transaction-nav"><Link href="/#swap">Swap</Link><Link href="/#swap">Bridge</Link><Link href="/#networks">Networks</Link><Link className="nav-active" href="/transactions">Transactions</Link><Link href="/docs">Docs <ArrowUpRight size={13}/></Link><a className="header-social" href="https://x.com/" target="_blank" rel="noreferrer" aria-label="OrbitBridge on X">𝕏</a></nav><div className="top-actions"><ConnectButton showBalance={false}/></div></header>
  <section className="transactions-content">
   <div className="transactions-title-row"><div><span className="eyebrow">ORBITBRIDGE ACTIVITY</span><h1>Transactions</h1><p>Track swap and bridge activity submitted through OrbitBridge.</p></div><button className="transaction-refresh" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={15}/> Refresh</button></div>
   <div className="transaction-mode" role="group" aria-label="Transaction scope">
    <button className={mode==='all'?'active':''} onClick={()=>setMode('all')}><Globe2 size={15}/> Public activity</button>
    <button className={mode==='mine'?'active':''} onClick={()=>setMode('mine')} disabled={!isConnected||!address}><UserRound size={15}/> My wallet</button>
    <span className="live-indicator"><i/> Auto-refresh 20s</span>
   </div>
   <div className="transaction-filters"><label className="transaction-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search wallet, transaction hash, asset…" /></label><div className="route-filters"><span>Route</span><select value={from} onChange={e=>setFrom(e.target.value)} aria-label="From network">{chains.map(c=><option key={c}>{c}</option>)}</select><ArrowDownUp size={16}/><select value={to} onChange={e=>setTo(e.target.value)} aria-label="To network">{chains.map(c=><option key={c}>{c}</option>)}</select></div></div>
   {error&&<div className="transaction-error" role="status">{error} {error.toLowerCase().includes('supabase')||error.toLowerCase().includes('configured')?'Set up the database using the included SQL and environment instructions.':''}</div>}
   <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>From</th><th>To</th><th>Transaction</th><th>Status</th><th>Submitted</th></tr></thead><tbody>
   {filtered.map((tx,index)=>{const live=statuses[tx.tx_hash];const base=explorer[tx.from_chain_id];const link=base?base+tx.tx_hash:'';return <tr key={tx.tx_hash||index}>
    <td><strong>{tx.from_chain}</strong><small>{tx.from_token||'Asset'}</small></td>
    <td><strong>{tx.to_chain}</strong><small>{tx.to_token||'Asset'}</small></td>
    <td><div className="transaction-hash"><span className="transaction-kind">{tx.kind==='bridge'?'BRIDGE':'SWAP'}</span>{link?<a href={link} target="_blank" rel="noreferrer">{short(tx.tx_hash)} <ExternalLink size={12}/></a>:<span>{short(tx.tx_hash)}</span>}<small>{short(tx.wallet)}</small></div></td>
    <td><span className={`transaction-status status-${(live?.status||tx.status||'submitted').toLowerCase()}`}>{statusLabel(tx)}</span><small className="transaction-status-detail">{live?.detail||'Checking transaction status…'}</small></td>
    <td>{tx.created_at?new Date(tx.created_at).toLocaleString(): '—'}</td>
   </tr>})}
   {!loading&&filtered.length===0&&<tr><td colSpan={5}><div className="transactions-empty"><span className="empty-icon"><ArrowRightLeft size={22}/></span><strong>{error?'Unable to load transaction activity':search?'No matching activity found':'No OrbitBridge transactions recorded yet'}</strong><p>{mode==='mine'?'Transactions submitted by this connected wallet will appear here once history storage is configured.':'Swap and bridge transactions will appear here after they are submitted through OrbitBridge and saved to the transaction database.'}</p><span className="empty-meta"><Clock3 size={13}/>{loading?'Loading transaction data…':'No transaction data available'}</span></div></td></tr>}
   {loading&&filtered.length===0&&<tr><td colSpan={5}><div className="transactions-empty"><RefreshCw size={20}/> Loading transaction history…</div></td></tr>}
   </tbody></table></div>
   <div className="transactions-footnote">Showing <strong>{filtered.length}</strong> of <strong>{transactions.length}</strong> recorded transactions{lastUpdated&&<span> · Updated {lastUpdated.toLocaleTimeString()}</span>}. Source-chain confirmation does not by itself guarantee destination-chain settlement.</div>
  </section><footer className="footer"><Link className="brand footer-brand" href="/"><img className="brand-logo" src="/orbitbridge-emblem.png" alt="" aria-hidden="true"/><span>OrbitBridge</span></Link><span>Swap &amp; Bridge. <span className="footer-muted">One Click Simple and Rewards.</span></span><div className="footer-links"><Link href="/transactions">Transactions</Link><Link href="/docs">OrbitBridge Docs <ArrowUpRight size={12}/></Link></div><span className="copyright">© 2026 OrbitBridge</span></footer>
 </main>
}
export default function TransactionsPage(){return <WalletProvider><TransactionsContent/></WalletProvider>}
