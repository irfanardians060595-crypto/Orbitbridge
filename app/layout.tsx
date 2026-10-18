import type { Metadata } from 'next';
import './globals.css';
import CinematicIntro from '@/components/CinematicIntro';
import OrbitField from '@/components/OrbitField';
export const metadata: Metadata = {
  title: 'OrbitBridge — Swap & Bridge',
  description: 'Swap & Bridge. One Click Simple and Rewards with OrbitBridge.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><OrbitField /><CinematicIntro />{children}</body></html>;
}
