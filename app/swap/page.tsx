'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowLeftRight, ArrowUpRight, Check, ChevronDown, Clock3, Compass, Globe2, Menu, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSendTransaction, useSwitchChain } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import WalletProvider from '@/components/WalletProvider';
import { Chain, Currency, getChains, getCurrencies, getQuote } from '@/lib/relay';

type Quote = any;
const FALLBACK_CHAINS: Chain[] = [
 {id:1,name:'Ethereum',currency:{symbol:'ETH'}},{id:8453,name:'Base',currency:{symbol:'ETH'}},{id:42161,name:'Arbitrum',currency:{symbol:'ETH'}},{id:10,name:'Optimism',currency:{symbol:'ETH'}},{id:137,name:'Polygon',currency:{symbol:'POL'}},{id:56,name:'BNB Chain',currency:{symbol:'BNB'}},{id:43114,name:'Avalanche',currency:{symbol:'AVAX'}},{id:7777777,name:'Zora',currency:{symbol:'ETH'}},{id:4663,name:'Robinhood Chain',currency:{symbol:'ETH'},iconUrl:'/robinhood-chain.svg'}
];
const FALLBACK_TOKENS: Record<number, Currency[]> = {
 1:[{chainId:1,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18},{chainId:1,address:'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',symbol:'USDC',name:'USD Coin',decimals:6}],
 8453:[{chainId:8453,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18},{chainId:8453,address:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',symbol:'USDC',name:'USD Coin',decimals:6}],
 42161:[{chainId:42161,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18},{chainId:42161,address:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',symbol:'USDC',name:'USD Coin',decimals:6}],
 10:[{chainId:10,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18},{chainId:10,address:'0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',symbol:'USDC',name:'USD Coin',decimals:6}],
 137:[{chainId:137,address:'0x0000000000000000000000000000000000000000',symbol:'POL',name:'POL',decimals:18},{chainId:137,address:'0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',symbol:'USDC',name:'USD Coin',decimals:6}],
 56:[{chainId:56,address:'0x0000000000000000000000000000000000000000',symbol:'BNB',name:'BNB',decimals:18},{chainId:56,address:'0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',symbol:'USDC',name:'USD Coin',decimals:18}],
 43114:[{chainId:43114,address:'0x0000000000000000000000000000000000000000',symbol:'AVAX',name:'Avalanche',decimals:18},{chainId:43114,address:'0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',symbol:'USDC',name:'USD Coin',decimals:6}],
 7777777:[{chainId:7777777,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18}],
 4663:[{chainId:4663,address:'0x0000000000000000000000000000000000000000',symbol:'ETH',name:'Ether',decimals:18}]
};
function shortAddress(s?: string) { return s ? `${s.slice(0,6)}…${s.slice(-4)}` : ''; }
function formatAmount(value: string | number | undefined, decimals=6) { if (value === undefined || value === null || value === '') return '—'; const n=Number(value); return Number.isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:decimals}) : String(value); }
function readQuoteMetric(q: any, patterns: RegExp[]): string | null {
 const found:Array<{key:string;value:any}>=[];
 const walk=(obj:any,depth=0)=>{if(!obj||typeof obj!=='object'||depth>6)return;for(const [key,value] of Object.entries(obj)){if(patterns.some(pattern=>pattern.test(key))){if(typeof value==='string'||typeof value==='number')found.push({key,value});else if(value&&typeof value==='object'){const formatted=(value as any).amountFormatted??(value as any).formattedAmount??(value as any).valueFormatted;const amount=(value as any).amount??(value as any).value;const symbol=(value as any).currency?.symbol??(value as any).currencySymbol??'';if(formatted!==undefined)found.push({key,value:`${formatted}${symbol?` ${symbol}`:''}`});else if(amount!==undefined)found.push({key,value:`${amount}${symbol?` ${symbol}`:''} (raw quote value)`});}}if(value&&typeof value==='object')walk(value,depth+1);}};
 walk(q);const usable=found.find(x=>x.value!==''&&x.value!==null&&x.value!==undefined);if(!usable)return null;
 if(typeof usable.value==='number'&&/percent|percentage/i.test(usable.key))return `${usable.value}%`;
 if(typeof usable.value==='string'&&/percent|percentage/i.test(usable.key)&&!usable.value.includes('%'))return `${usable.value}%`;
 return String(usable.value);
}
function getLogoUrl(item:any):string|undefined{return item?.iconUrl||item?.logoURI||item?.logoUrl||item?.metadata?.logoURI||item?.metadata?.logoUrl||item?.metadata?.logo;}
function getFeeValue(q:any,kind:'network'|'provider'):string|null{
 const pattern=kind==='network'?/gas|network|origin/i:/relayer|bridge|provider|app|protocol|service/i;const results:string[]=[];
 const walk=(obj:any,keyPath='')=>{if(!obj||typeof obj!=='object')return;for(const [key,value]of Object.entries(obj)){const path=`${keyPath}.${key}`;if(pattern.test(key)&&value&&typeof value==='object'){const fee:any=value;const formatted=fee.amountFormatted??fee.formattedAmount??fee.amountUsd;const amount=fee.amount??fee.value;const symbol=fee.currency?.symbol??fee.currencySymbol??'';if(formatted!==undefined)results.push(`${formatted}${symbol?` ${symbol}`:''}`);else if(amount!==undefined)results.push(`${amount}${symbol?` ${symbol}`:''} (raw quote value)`);}else if(pattern.test(path)&&(typeof value==='string'||typeof value==='number'))results.push(String(value));if(value&&typeof value==='object')walk(value,path);}};
 walk(q?.details?.fees??q?.fees??q);return results.find(value=>value!=='')??null;
}

function SwapApp() {
 const { address, isConnected, chain } = useAccount();
 const { sendTransactionAsync } = useSendTransaction();
 const { switchChainAsync } = useSwitchChain();
 const [chains,setChains]=useState<Chain[]>(FALLBACK_CHAINS);
 const [fromChain,setFromChain]=useState(8453); const [toChain,setToChain]=useState(1);
 const [fromTokens,setFromTokens]=useState<Currency[]>(FALLBACK_TOKENS[8453]); const [toTokens,setToTokens]=useState<Currency[]>(FALLBACK_TOKENS[1]);
 const [fromToken,setFromToken]=useState<Currency>(FALLBACK_TOKENS[8453][0]); const [toToken,setToToken]=useState<Currency>(FALLBACK_TOKENS[1][0]);
 const [amount,setAmount]=useState('0.1'); const [quote,setQuote]=useState<Quote|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState(''); const [busy,setBusy]=useState(false); const [modal,setModal]=useState<'from'|'to'|null>(null); const [tokenSearch,setTokenSearch]=useState(''); const [chainSearch,setChainSearch]=useState(''); const [tab,setTab]=useState<'swap'|'bridge'>('swap'); const [mobileMenu,setMobileMenu]=useState(false);
 const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
 const balanceSupported = [1,8453,42161,10,137,56,43114,7777777,4663].includes(fromChain);
 const receiveBalanceSupported = [1,8453,42161,10,137,56,43114,7777777,4663].includes(toChain);
 const { data: fromBalance, isLoading: fromBalanceLoading, isError: fromBalanceError } = useBalance({
   address,
   chainId: fromChain as any,
   token: fromToken.address.toLowerCase() === ZERO_ADDRESS ? undefined : fromToken.address as `0x${string}`,
   query: { enabled: Boolean(isConnected && address && balanceSupported), refetchInterval: 15000 }
 });
 const { data: toBalance, isLoading: toBalanceLoading, isError: toBalanceError } = useBalance({
   address,
   chainId: toChain as any,
   token: toToken.address.toLowerCase() === ZERO_ADDRESS ? undefined : toToken.address as `0x${string}`,
   query: { enabled: Boolean(isConnected && address && receiveBalanceSupported), refetchInterval: 15000 }
 });
 const fromBalanceText = !isConnected ? 'Connect wallet to view balance' : !balanceSupported || fromBalanceError ? 'Balance unavailable on this network' : fromBalanceLoading ? 'Loading balance…' : fromBalance ? `${formatAmount(formatUnits(fromBalance.value, fromToken.decimals), 6)} ${fromToken.symbol}` : 'Balance unavailable';
 const toBalanceText = !isConnected ? 'Connect wallet to view balance' : !receiveBalanceSupported || toBalanceError ? 'Balance unavailable on this network' : toBalanceLoading ? 'Loading balance…' : toBalance ? `${formatAmount(formatUnits(toBalance.value, toToken.decimals), 6)} ${toToken.symbol}` : 'Balance unavailable';
 function useMaxBalance() {
   if (!isConnected || !fromBalance || fromBalanceError) { setNotice('Wallet balance is not available for this token/network yet.'); return; }
   const value = formatUnits(fromBalance.value, fromToken.decimals);
   setAmount(value);
   setQuote(null);
   setError('');
   setNotice('');
 }
 useEffect(()=>{getChains().then(list=>{if(list.length)setChains(list.some(c=>c.id===4663)?list:[...list,{id:4663,name:'Robinhood Chain',currency:{symbol:'ETH'},iconUrl:'/robinhood-chain.svg'}])}).catch(()=>{});},[]);
 useEffect(()=>{let live=true;getCurrencies(fromChain).then(t=>{if(live&&t.length){setFromTokens(t);setFromToken(prev=>t.find(x=>x.address.toLowerCase()===prev.address.toLowerCase())||t[0])}}).catch(()=>{if(live){const t=FALLBACK_TOKENS[fromChain];if(t){setFromTokens(t);setFromToken(t[0])}}});return()=>{live=false}},[fromChain]);
 useEffect(()=>{let live=true;getCurrencies(toChain).then(t=>{if(live&&t.length){setToTokens(t);setToToken(prev=>t.find(x=>x.address.toLowerCase()===prev.address.toLowerCase())||t[0])}}).catch(()=>{if(live){const t=FALLBACK_TOKENS[toChain];if(t){setToTokens(t);setToToken(t[0])}}});return()=>{live=false}},[toChain]);
 const selectedChain=useMemo(()=>chains.find(c=>c.id===fromChain),[chains,fromChain]);
 async function requestQuote(){setError('');setNotice('');setQuote(null);if(!isConnected||!address){setError('Connect your wallet first to request a route.');return}if(!amount||Number(amount)<=0){setError('Enter an amount greater than zero.');return}setLoading(true);try{const raw=parseUnits(amount,fromToken.decimals).toString();const q=await getQuote({user:address,originChainId:fromChain,destinationChainId:toChain,originCurrency:fromToken.address,destinationCurrency:toToken.address,amount:raw});setQuote(q);if(!q?.steps?.length)setNotice('Relay returned a quote, but no executable steps were included. Review the response before continuing.')}catch(e:any){setError(e?.message||'Could not get a route from Relay. Please try again.')}finally{setLoading(false)}}
 async function execute(){
  if(!quote?.steps?.length){setError('No executable quote is available. Get a fresh quote first.');return}
  setBusy(true);setError('');setNotice('');
  const operationId=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let savedCount=0;let submittedCount=0;
  try{
   for(const step of quote.steps){
    for(const item of (step.items||[])){
     const tx=item?.data;
     if(!tx?.to){
      if(item?.check?.endpoint){setNotice('Relay route has a completion step. Submitted transactions will be tracked; final cross-chain settlement must be verified separately.');continue}
      throw new Error('Relay returned a step without transaction data.');
     }
     const targetChain=Number(tx.chainId||step.chainId||fromChain);
     if(chain?.id!==targetChain) await switchChainAsync({chainId:targetChain as any});
     const txHash=await sendTransactionAsync({to:tx.to as `0x${string}`,data:tx.data as `0x${string}`|undefined,value:tx.value?BigInt(tx.value):undefined,gas:tx.gas?BigInt(tx.gas):undefined});
     submittedCount++;
     try{
      const saved=await fetch('/api/transactions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
       wallet:address,txHash,operationId,kind:'swap',
       chainId:targetChain,destinationChainId:toChain,
       fromChain:chains.find(c=>c.id===fromChain)?.name||`Chain ${fromChain}`,
       toChain:chains.find(c=>c.id===toChain)?.name||`Chain ${toChain}`,
       fromToken:fromToken.symbol,toToken:toToken.symbol,amount,
       relayRequestId:quote?.requestId||quote?.details?.requestId||null
      })});
      if(saved.ok)savedCount++;
     }catch{/* A database/network issue must not misreport an already-submitted wallet transaction as failed. */}
    }
   }
   if(submittedCount===0) setNotice('No wallet transaction was submitted. Follow the route instructions to complete this Relay route.');
   else if(savedCount===submittedCount) setNotice('Transaction submitted and saved to OrbitBridge history. The page will track source-chain confirmation; cross-chain settlement may take longer.');
   else setNotice('Transaction submitted. History storage is not fully configured or temporarily unavailable; save the transaction hash from your wallet.');
   setQuote(null);
  }catch(e:any){setError(e?.shortMessage||e?.message||'Transaction was not completed.')}finally{setBusy(false)}
 }
 const filteredTokens=(modal==='from'?fromTokens:toTokens).filter(t=>`${t.symbol} ${t.name||''} ${t.address}`.toLowerCase().includes(tokenSearch.toLowerCase())).slice(0,100);
 function swapSides(){setFromChain(toChain);setToChain(fromChain);setFromToken(toToken);setToToken(fromToken);setFromTokens(toTokens);setToTokens(fromTokens);setQuote(null);setError('')}
 const outputAmount=quote?.details?.currencyOut?.amountFormatted || quote?.quote?.currencyOut?.amountFormatted || (quote?.details?.currencyOut?.amount && quote?.details?.currencyOut?.currency?.decimals !== undefined ? formatAmount(Number(quote.details.currencyOut.amount) / (10 ** Number(quote.details.currencyOut.currency.decimals)), 7) : null);
 const outputSymbol=quote?.details?.currencyOut?.currency?.symbol || toToken.symbol;
 const priceImpact=readQuoteMetric(quote,[/priceImpact/i]);
 const slippage=readQuoteMetric(quote,[/slippageTolerancePercent/i,/maxSlippagePercent/i,/slippageTolerance/i,/slippage/i]);
 const networkFee=getFeeValue(quote,'network'); const providerFee=getFeeValue(quote,'provider');
 const rate=amount&&Number(amount)>0&&outputAmount&&Number.isFinite(Number(outputAmount))?`1 ${fromToken.symbol} ≈ ${formatAmount(Number(outputAmount)/Number(amount),7)} ${outputSymbol}`:null;
 return <main className="site-shell">
  <header className="topbar"><a className="brand" href="/" aria-label="OrbitBridge home"><img className="brand-logo" src="/orbitbridge-logo.svg" alt="" aria-hidden="true"/><span>OrbitBridge</span></a>
   <nav className={mobileMenu?'nav-links nav-open':'nav-links'}><a className="nav-active" href="/swap">Swap</a><a href="/bridge">Bridge</a><a href="/#networks">Networks</a><a href="/transactions">Transactions</a><a href="/docs">Docs <ArrowUpRight size={13}/></a><a className="header-social" href="https://x.com/" target="_blank" rel="noreferrer" aria-label="OrbitBridge on X">𝕏</a></nav>
   <div className="top-actions"><ConnectButton showBalance={false}/><button className="mobile-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu?<X/>:<Menu/>}</button></div>
  </header>
  <div className="swap-page-layout"><section className="swap-page-intro"><span className="eyebrow">ORBITBRIDGE / SWAP</span><h1>Make your next move.</h1><p>Choose your assets and networks, then review the route before confirming in your wallet.</p></section>
  <section className="workspace" id="swap"><div className="swap-card"><div className="card-heading"><div><div className="eyebrow">YOUR NEXT MOVE</div><h2>Swap &amp; Bridge anything.</h2></div><button className="icon-button" title="Swap settings" onClick={()=>setNotice('Route preferences are currently set to Relay’s default best-route selection.')}><Sparkles size={17}/></button></div>
   <div className="mode-switch"><button className={tab==='swap'?'mode-active':''} onClick={()=>{setTab('swap');setQuote(null)}}><ArrowLeftRight size={15}/> Swap</button><button className={tab==='bridge'?'mode-active':''} onClick={()=>{setTab('bridge');setQuote(null)}}><Compass size={15}/> Bridge</button><span className="mode-note">Powered by Relay</span></div>
   <div className="asset-box"><div className="asset-topline"><span>{tab==='swap'?'You pay':'From network'}</span><button className="chain-select" onClick={()=>{setModal('from');setTokenSearch('')}}><span className="chain-dot" style={{background:fromChain===8453?'#2456f5':fromChain===1?'#7f8ca5':fromChain===42161?'#2c72ee':'#5b9dff'}}/>{chains.find(c=>c.id===fromChain)?.name||`Chain ${fromChain}`} <ChevronDown size={14}/></button></div><div className="asset-main"><input className="amount-input" inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setQuote(null)}} aria-label="Amount to swap"/><button className="token-select" onClick={()=>{setModal('from');setTokenSearch('')}}><span className="token-icon">{fromToken.symbol.slice(0,1)}</span><span className="token-name">{fromToken.symbol}</span><ChevronDown size={16}/></button></div><div className="asset-bottom"><span className="balance-label">{fromToken.name||fromToken.symbol}<small>{fromBalanceText}</small></span><div className="amount-shortcuts">{[25,50,100].map(percent=><button key={percent} className="percent-button" onClick={()=>{if(!fromBalance||fromBalanceError){setNotice('Wallet balance is not available for this token/network yet.');return;}const raw=Number(formatUnits(fromBalance.value,fromToken.decimals));const value=percent===100?raw:raw*percent/100;setAmount(String(Number(value.toFixed(Math.min(fromToken.decimals,8)))));setQuote(null);setError('');setNotice('')}} disabled={!isConnected||!fromBalance}>{percent}%</button>)}<button className="max-button" onClick={useMaxBalance} disabled={!isConnected||!fromBalance}>MAX</button></div></div></div>
   <div className="switch-row"><span className="switch-line"/><button className="reverse-button" onClick={swapSides} title="Reverse networks and tokens"><ArrowDownUp size={17}/></button><span className="switch-line"/></div>
   <div className="asset-box receive-box"><div className="asset-topline"><span>{tab==='swap'?'You receive':'To network'}</span><button className="chain-select" onClick={()=>{setModal('to');setTokenSearch('')}}><span className="chain-dot" style={{background:toChain===1?'#7f8ca5':toChain===8453?'#2456f5':'#8f78ee'}}/>{chains.find(c=>c.id===toChain)?.name||`Chain ${toChain}`} <ChevronDown size={14}/></button></div><div className="asset-main"><div className={quote?'amount-output':'amount-placeholder'}>{quote?formatAmount(outputAmount,7):'—'}</div><button className="token-select" onClick={()=>{setModal('to');setTokenSearch('')}}><span className="token-icon token-icon-alt">{toToken.symbol.slice(0,1)}</span><span className="token-name">{toToken.symbol}</span><ChevronDown size={16}/></button></div><div className="asset-bottom"><span className="balance-label">{quote?`Estimated ${outputSymbol} received`:toToken.name||toToken.symbol}<small>{toBalanceText}</small></span><span className="receive-caption">{quote?'Quote estimate':'Estimated amount'}</span></div></div>
   {quote&&<div className="quote-details" aria-label="Transaction details"><div className="quote-details-heading"><strong>Transaction details</strong><span>Relay quote</span></div><div><span>Route</span><strong>{chains.find(c=>c.id===fromChain)?.name||`Chain ${fromChain}`} → {chains.find(c=>c.id===toChain)?.name||`Chain ${toChain}`}</strong></div><div><span>Exchange rate</span><strong>{rate||'Not provided by quote'}</strong></div><div><span>Price impact</span><strong>{priceImpact??'Not provided by quote'}</strong></div><div><span>Max slippage</span><strong>{slippage??'Not provided by quote'}</strong></div><div><span>Network / gas fees</span><strong>{networkFee??'Not provided by quote'}</strong></div><div><span>Provider / bridge fees</span><strong>{providerFee??'Not provided by quote'}</strong></div><div><span>Estimated time</span><strong><Clock3 size={13}/> {quote?.details?.timeEstimate?`${Math.max(1,Math.round(Number(quote.details.timeEstimate)/60))} min`:'Not provided by quote'}</strong></div></div>}
   {error&&<div className="feedback feedback-error">{error}</div>}{notice&&<div className="feedback feedback-info">{notice}</div>}
   {!isConnected?<div className="connect-hint"><Wallet size={16}/> Connect a wallet to request a live quote.</div>:null}
   {quote?.steps?.length?<button className="primary-button" disabled={busy} onClick={execute}>{busy?'Waiting for wallet…':'Confirm in wallet'} <ArrowUpRight size={17}/></button>:<button className="primary-button" disabled={loading} onClick={requestQuote}>{loading?'Finding the best route…':!isConnected?'Connect wallet to continue':'Review route'} <ArrowUpRight size={17}/></button>}
   <div className="card-footnote"><ShieldCheck size={13}/> You stay in control of your assets. Review all wallet prompts carefully.</div>
  </div>
  <aside className="side-note"><div className="side-ornament"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core">G<span>.</span></div><div className="orbit-star">✳</div></div><div className="side-tag">BUILT FOR THE MULTICHAIN ERA</div><h3>One less thing<br/>to think about.</h3><p>Different networks. Different tokens. One clear place to make your next move.</p><div className="side-stat"><span className="stat-label">THE ORBITBRIDGE WAY</span><span className="stat-value">Less friction. <i>More freedom.</i></span></div><div className="side-foot"><span className="tiny-badge"><Check size={12}/></span> Non-custodial by design</div></aside></section></div>
  <footer className="footer"><a className="brand footer-brand" href="/"><img className="brand-logo" src="/orbitbridge-logo.svg" alt="" aria-hidden="true"/><span>OrbitBridge</span></a><span>Swap &amp; Bridge. <span className="footer-muted">One Click Simple and Rewards.</span></span><div className="footer-links"><a href="/swap">Swap</a><a href="/transactions">Transactions</a><a href="https://relay.link/" target="_blank" rel="noreferrer">Relay <ArrowUpRight size={12}/></a><a href="/docs">OrbitBridge Docs <ArrowUpRight size={12}/></a></div><span className="copyright">© 2026 OrbitBridge</span></footer>
  {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><div className="token-modal token-modal-relay" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">SELECT ASSET</span><h3>Choose a network & token</h3></div><button className="icon-button" onClick={()=>setModal(null)} aria-label="Close selector"><X size={17}/></button></div><div className="token-modal-columns"><section className="token-modal-networks"><label className="search-field"><span>⌕</span><input placeholder="Search chains" value={chainSearch} onChange={e=>setChainSearch(e.target.value)}/></label><div className="modal-section-title">NETWORKS</div><div className="network-picker network-picker-list">{chains.filter(c=>`${c.name} ${c.id}`.toLowerCase().includes(chainSearch.toLowerCase())).map(c=><button key={c.id} className={(modal==='from'?fromChain:toChain)===c.id?'picker-chain picker-selected':'picker-chain'} onClick={()=>{if(modal==='from'){setFromChain(c.id);const list=FALLBACK_TOKENS[c.id]||[];if(list.length)setFromToken(list[0])}else{setToChain(c.id);const list=FALLBACK_TOKENS[c.id]||[];if(list.length)setToToken(list[0])}setQuote(null);setTokenSearch('')}}><span className="chain-logo-wrap"><span className="chain-dot"/>{getLogoUrl(c)&&<img src={getLogoUrl(c)} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}</span><span className="chain-label">{c.name}</span>{(modal==='from'?fromChain:toChain)===c.id&&<Check size={14}/>}</button>)}</div></section><section className="token-modal-tokens"><label className="search-field"><span>⌕</span><input placeholder="Search token or paste address" value={tokenSearch} onChange={e=>setTokenSearch(e.target.value)}/></label><div className="modal-section-title">TOKENS ON {chains.find(c=>c.id===(modal==='from'?fromChain:toChain))?.name||'SELECTED NETWORK'}</div><div className="token-list token-list-relay">{filteredTokens.map(t=><button className="token-option" key={`${t.chainId}-${t.address}`} onClick={()=>{if(modal==='from')setFromToken(t);else setToToken(t);setModal(null);setQuote(null)}}><span className="token-logo-wrap"><span className="token-icon">{t.symbol.slice(0,1)}</span>{getLogoUrl(t)&&<img src={getLogoUrl(t)} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}</span><span className="token-option-name"><strong>{t.symbol}</strong><small>{t.name||shortAddress(t.address)}</small><small className="token-address">{shortAddress(t.address)}</small></span><span className="token-chain-label">{chains.find(c=>c.id===t.chainId)?.name}</span></button>) }{!filteredTokens.length&&<p className="empty-state">No tokens found on this network.</p>}</div></section></div></div></div>}
 </main>
}
export default function Page(){return <WalletProvider><SwapApp/></WalletProvider>}
