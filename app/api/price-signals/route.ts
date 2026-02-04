import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  // Mock live market data (safe, deterministic)
  const signals = [
    { asset: 'IG_Premium_Tech', current: 432, delta: 1.6, direction: 'up' },
    { asset: 'YT_Gaming_Pro', current: 882, delta: -0.9, direction: 'down' },
    { asset: 'TT_Creator_Elite', current: 347, delta: 2.1, direction: 'up' },
    { asset: 'Twitter_News_Feed', current: 661, delta: -1.3, direction: 'down' }
  ];

  return NextResponse.json(signals);
}
