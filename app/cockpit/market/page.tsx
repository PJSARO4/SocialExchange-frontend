'use client';

/**
 * Trading Floor - SExCOINS Market
 *
 * Where users can:
 * - View all public creators/brands
 * - Buy/sell shares
 * - Track their portfolio
 * - Go public (IPO)
 *
 * ⚠️ DEMO MODE - Not for real trading
 */

import { useState, useEffect } from 'react';
import {
  formatCoins,
  formatUsd,
  formatPercent,
  SEXCOIN_USD_RATE,
} from '@/lib/market/constants';

// Types
interface Brand {
  id: string;
  ticker: string;
  name: string;
  logoUrl?: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
}

interface WalletBalance {
  available: number;
  locked: number;
  total: number;
  usdValue: number;
}

interface Holding {
  brandId: string;
  brand: Brand;
  quantity: number;
  totalCost: number;
  averageCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface Portfolio {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: Holding[];
}

export default function TradingFloorPage() {
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'ipo'>('market');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [trading, setTrading] = useState(false);

  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // IPO state
  const [ipoForm, setIpoForm] = useState({
    ticker: '',
    name: '',
    description: '',
    sharesIssued: '1000',
    initialPrice: '10',
  });
  const [submittingIPO, setSubmittingIPO] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [brandsRes, walletRes, portfolioRes] = await Promise.all([
        fetch('/api/market/brands'),
        fetch('/api/market/wallet'),
        fetch('/api/market/portfolio'),
      ]);

      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrands(data.brands || []);
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.balance);
      }

      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data.portfolio);
        if (data.wallet) setWallet(data.wallet);
      }
    } catch (err) {
      console.error('Failed to load market data', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTrade() {
    if (!selectedBrand || !tradeQuantity) return;

    setTrading(true);
    try {
      const res = await fetch('/api/market/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: selectedBrand.id,
          side: tradeType,
          quantity: parseFloat(tradeQuantity),
          orderType: 'MARKET',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Trade failed');
        return;
      }

      alert(`${tradeType} order filled! ${data.trade?.quantity} shares @ ${data.trade?.price.toFixed(4)} coins`);
      setShowTradeModal(false);
      setTradeQuantity('');
      fetchData();
    } catch (err) {
      alert('Trade failed');
    } finally {
      setTrading(false);
    }
  }

  async function handleDeposit() {
    if (!depositAmount) return;

    setDepositing(true);
    try {
      const res = await fetch('/api/market/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          amount: parseFloat(depositAmount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Deposit failed');
        return;
      }

      alert(`Deposited $${depositAmount}! Received ${data.coinsReceived?.toFixed(2)} SExCOINS`);
      setShowDepositModal(false);
      setDepositAmount('');
      if (data.newBalance) setWallet(data.newBalance);
    } catch (err) {
      alert('Deposit failed');
    } finally {
      setDepositing(false);
    }
  }

  async function handleIPO() {
    setSubmittingIPO(true);
    try {
      const res = await fetch('/api/market/ipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ipoForm.ticker,
          name: ipoForm.name,
          description: ipoForm.description,
          sharesIssued: parseInt(ipoForm.sharesIssued),
          initialPrice: parseFloat(ipoForm.initialPrice),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'IPO failed');
        return;
      }

      alert(data.message || 'IPO successful!');
      setIpoForm({ ticker: '', name: '', description: '', sharesIssued: '1000', initialPrice: '10' });
      if (data.newBalance) setWallet(data.newBalance);
      fetchData();
    } catch (err) {
      alert('IPO failed');
    } finally {
      setSubmittingIPO(false);
    }
  }

  function openTradeModal(brand: Brand, type: 'BUY' | 'SELL') {
    setSelectedBrand(brand);
    setTradeType(type);
    setTradeQuantity('');
    setShowTradeModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-400 animate-pulse">Loading Trading Floor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Demo Banner */}
      <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <span className="text-xl">⚠️</span>
          <span className="font-bold">DEMO MODE</span>
        </div>
        <p className="text-yellow-200/70 text-sm mt-1">
          This is a prototype. No real money is being exchanged. For demonstration only.
        </p>
      </div>

      {/* Header with Wallet */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Floor</h1>
          <p className="text-white/60">Buy & sell shares in creators</p>
        </div>

        {/* Wallet Summary */}
        <div className="flex items-center gap-4">
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg px-4 py-2">
            <div className="text-xs text-white/50">Wallet Balance</div>
            <div className="text-lg font-bold text-cyan-400">
              {formatCoins(wallet?.available || 0)} <span className="text-sm text-white/50">SExCOINS</span>
            </div>
            <div className="text-xs text-white/40">
              ≈ {formatUsd((wallet?.available || 0) * SEXCOIN_USD_RATE)}
            </div>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            + Add Funds
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['market', 'portfolio', 'ipo'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab === 'market' && '📊 Market'}
            {tab === 'portfolio' && '💼 Portfolio'}
            {tab === 'ipo' && '🚀 Go Public'}
          </button>
        ))}
      </div>

      {/* Market Tab */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-2 pl-4">Brand</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">24h Change</th>
                  <th className="pb-2">Market Cap</th>
                  <th className="pb-2">Volume</th>
                  <th className="pb-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(brand => (
                  <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {brand.ticker[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">${brand.ticker}</div>
                          <div className="text-sm text-white/50">{brand.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-white font-mono">{brand.currentPrice.toFixed(4)}</div>
                      <div className="text-xs text-white/40">coins/share</div>
                    </td>
                    <td className="py-4">
                      <span className={`font-medium ${brand.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(brand.priceChange24h)}
                      </span>
                    </td>
                    <td className="py-4 text-white/70">
                      {formatCoins(brand.marketCap)}
                    </td>
                    <td className="py-4 text-white/70">
                      {formatCoins(brand.volume24h)}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openTradeModal(brand, 'BUY')}
                          className="px-3 py-1 bg-green-600/80 hover:bg-green-500 text-white text-sm rounded transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => openTradeModal(brand, 'SELL')}
                          className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white text-sm rounded transition-colors"
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/50">
                      No brands listed yet. Be the first to go public!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-white/50">Portfolio Value</div>
              <div className="text-2xl font-bold text-white">{formatCoins(portfolio?.totalValue || 0)}</div>
              <div className="text-xs text-white/40">SExCOINS</div>
            </div>
            <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-white/50">Total Cost</div>
              <div className="text-2xl font-bold text-white">{formatCoins(portfolio?.totalCost || 0)}</div>
            </div>
            <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-white/50">Total P&L</div>
              <div className={`text-2xl font-bold ${(portfolio?.totalProfitLoss || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(portfolio?.totalProfitLoss || 0) >= 0 ? '+' : ''}{formatCoins(portfolio?.totalProfitLoss || 0)}
              </div>
            </div>
            <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-4">
              <div className="text-sm text-white/50">P&L %</div>
              <div className={`text-2xl font-bold ${(portfolio?.totalProfitLossPercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(portfolio?.totalProfitLossPercent || 0)}
              </div>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-2 pl-4">Brand</th>
                  <th className="pb-2">Shares</th>
                  <th className="pb-2">Avg Cost</th>
                  <th className="pb-2">Current Price</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">P&L</th>
                  <th className="pb-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio?.holdings.map(holding => (
                  <tr key={holding.brandId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {holding.brand.ticker[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">${holding.brand.ticker}</div>
                          <div className="text-xs text-white/50">{holding.brand.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-white">{holding.quantity.toFixed(2)}</td>
                    <td className="py-4 text-white/70">{holding.averageCost.toFixed(4)}</td>
                    <td className="py-4 text-white">{holding.brand.currentPrice.toFixed(4)}</td>
                    <td className="py-4 text-white">{formatCoins(holding.currentValue)}</td>
                    <td className="py-4">
                      <div className={holding.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {holding.profitLoss >= 0 ? '+' : ''}{formatCoins(holding.profitLoss)}
                        <div className="text-xs">{formatPercent(holding.profitLossPercent)}</div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => openTradeModal(holding.brand, 'SELL')}
                        className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-white text-sm rounded transition-colors"
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
                {(!portfolio?.holdings || portfolio.holdings.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-white/50">
                      No holdings yet. Visit the Market tab to buy shares!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IPO Tab */}
      {activeTab === 'ipo' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">🚀 Go Public - Launch Your Brand</h2>
            <p className="text-white/60 mb-6">
              List yourself on the trading floor. Investors can buy shares in your brand,
              and you earn 2% royalty on every trade.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-6">
              <div className="text-yellow-400 font-medium">IPO Fee: 1,000 SExCOINS ($100)</div>
              <div className="text-yellow-200/60 text-sm">This fee goes to the liquidity reserve</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">Ticker Symbol</label>
                <input
                  type="text"
                  value={ipoForm.ticker}
                  onChange={e => setIpoForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  placeholder="e.g. PJSARO"
                  maxLength={10}
                  className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-1">Brand Name</label>
                <input
                  type="text"
                  value={ipoForm.name}
                  onChange={e => setIpoForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. PJ Saro"
                  className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-1">Description</label>
                <textarea
                  value={ipoForm.description}
                  onChange={e => setIpoForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What do you create? Why should people invest?"
                  rows={3}
                  className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Shares to Issue</label>
                  <input
                    type="number"
                    value={ipoForm.sharesIssued}
                    onChange={e => setIpoForm(f => ({ ...f, sharesIssued: e.target.value }))}
                    min={100}
                    max={1000000}
                    className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Initial Price (coins)</label>
                  <input
                    type="number"
                    value={ipoForm.initialPrice}
                    onChange={e => setIpoForm(f => ({ ...f, initialPrice: e.target.value }))}
                    min={0.01}
                    step={0.01}
                    className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* IPO Preview */}
              <div className="bg-[#02040a] border border-white/10 rounded p-4 mt-4">
                <div className="text-sm text-white/50 mb-2">IPO Preview</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-white/50">Market Cap:</span>{' '}
                    <span className="text-white">
                      {formatCoins(parseFloat(ipoForm.sharesIssued || '0') * parseFloat(ipoForm.initialPrice || '0'))}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">Your Shares (20%):</span>{' '}
                    <span className="text-white">
                      {Math.floor(parseFloat(ipoForm.sharesIssued || '0') * 0.2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">Public Float (80%):</span>{' '}
                    <span className="text-white">
                      {Math.floor(parseFloat(ipoForm.sharesIssued || '0') * 0.8)}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">IPO Fee:</span>{' '}
                    <span className="text-yellow-400">1,000 coins</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleIPO}
                disabled={submittingIPO || !ipoForm.ticker || !ipoForm.name || (wallet?.available || 0) < 1000}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
              >
                {submittingIPO ? 'Processing IPO...' : '🚀 Launch IPO'}
              </button>

              {(wallet?.available || 0) < 1000 && (
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance. You need 1,000 coins to IPO.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {showTradeModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {tradeType === 'BUY' ? '📈 Buy' : '📉 Sell'} ${selectedBrand.ticker}
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Current Price:</span>
                <span className="text-white">{selectedBrand.currentPrice.toFixed(4)} coins/share</span>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-1">Quantity (shares)</label>
                <input
                  type="number"
                  value={tradeQuantity}
                  onChange={e => setTradeQuantity(e.target.value)}
                  placeholder="How many shares?"
                  min={0.01}
                  step={0.01}
                  className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {tradeQuantity && (
                <div className="bg-[#02040a] border border-white/10 rounded p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Estimated Total:</span>
                    <span className="text-white">
                      {formatCoins(parseFloat(tradeQuantity || '0') * selectedBrand.currentPrice)} coins
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-white/40">+ Fees (3%):</span>
                    <span className="text-white/40">
                      ~{formatCoins(parseFloat(tradeQuantity || '0') * selectedBrand.currentPrice * 0.03)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTrade}
                  disabled={trading || !tradeQuantity || parseFloat(tradeQuantity) <= 0}
                  className={`flex-1 py-2 font-bold rounded-lg transition-colors ${
                    tradeType === 'BUY'
                      ? 'bg-green-600 hover:bg-green-500 disabled:bg-green-800'
                      : 'bg-red-600 hover:bg-red-500 disabled:bg-red-800'
                  } text-white disabled:opacity-50`}
                >
                  {trading ? 'Processing...' : `${tradeType} Shares`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] border border-cyan-500/30 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">💰 Add Funds</h3>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-4 text-sm">
              <div className="text-yellow-400">⚠️ DEMO MODE</div>
              <div className="text-yellow-200/60">No real money will be charged</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">Amount (USD)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={1}
                  className="w-full bg-[#02040a] border border-white/20 rounded px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {depositAmount && (
                <div className="bg-[#02040a] border border-white/10 rounded p-3">
                  <div className="flex justify-between">
                    <span className="text-white/50">You will receive:</span>
                    <span className="text-cyan-400 font-bold">
                      {formatCoins(parseFloat(depositAmount || '0') / SEXCOIN_USD_RATE)} SExCOINS
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Rate: 1 coin = $0.10
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                >
                  {depositing ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
