'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CockpitHeader() {
  const pathname = usePathname();

  return (
    <header className="cockpit-header">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link href="/cockpit" className="text-xl font-bold text-white">
            Social Exchange
          </Link>
          <nav className="flex gap-4">
            <Link 
              href="/cockpit/dashboard" 
              className={`text-sm ${pathname?.includes('/dashboard') ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/cockpit/my-e-assets" 
              className={`text-sm ${pathname?.includes('/my-e-assets') ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              My E-Assets
            </Link>
            <Link 
              href="/cockpit/market" 
              className={`text-sm ${pathname?.includes('/market') ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              Market
            </Link>
            <Link 
              href="/cockpit/comms" 
              className={`text-sm ${pathname?.includes('/comms') ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              Comms
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
