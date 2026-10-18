'use client';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, optimism, arbitrum, base, polygon, bsc, avalanche, zora, linea } from 'wagmi/chains';
import type { Chain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const robinhoodChain: Chain = { id: 4663, name: 'Robinhood Chain', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com/'] } }, blockExplorers: { default: { name: 'Robinhood Explorer', url: 'https://robinhoodchain.blockscout.com/' } } };

const config = getDefaultConfig({ appName: 'OrbitBridge', projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID', chains: [mainnet, optimism, arbitrum, base, polygon, bsc, avalanche, zora, linea, robinhoodChain], ssr: true });
export default function WalletProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <WagmiProvider config={config}><QueryClientProvider client={client}><RainbowKitProvider>{children}</RainbowKitProvider></QueryClientProvider></WagmiProvider>;
}
