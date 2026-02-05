'use client';

/**
 * E-SHARES WALLET SYSTEM
 * Manages user balances for E-Shares trading
 */

const WALLET_KEY = 'e-shares-wallets';

export interface Wallet {
  userId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'fee' | 'refund';
  amount: number;
  description: string;
  timestamp: number;
  relatedId?: string;
}

function getWallets(): Record<string, Wallet> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(WALLET_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveWallets(wallets: Record<string, Wallet>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallets));
}

export function getWallet(userId: string): Wallet {
  const wallets = getWallets();
  if (!wallets[userId]) {
    wallets[userId] = {
      userId,
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactions: [],
    };
    saveWallets(wallets);
  }
  return wallets[userId];
}

export function deposit(userId: string, amount: number): { success: boolean; wallet: Wallet; error?: string } {
  if (amount <= 0) return { success: false, wallet: getWallet(userId), error: 'Amount must be positive' };
  if (amount < 10) return { success: false, wallet: getWallet(userId), error: 'Minimum deposit is $10' };

  const wallets = getWallets();
  const wallet = wallets[userId] || {
    userId,
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    transactions: [],
  };

  wallet.balance += amount;
  wallet.totalDeposited += amount;
  wallet.transactions.push({
    id: crypto.randomUUID(),
    type: 'deposit',
    amount,
    description: `Deposited $${amount.toFixed(2)}`,
    timestamp: Date.now(),
  });

  wallets[userId] = wallet;
  saveWallets(wallets);
  return { success: true, wallet };
}

export function withdraw(userId: string, amount: number): { success: boolean; wallet: Wallet; error?: string } {
  if (amount <= 0) return { success: false, wallet: getWallet(userId), error: 'Amount must be positive' };

  const wallets = getWallets();
  const wallet = wallets[userId];
  if (!wallet) return { success: false, wallet: getWallet(userId), error: 'Wallet not found' };

  const fee = amount * 0.10;
  const totalDeducted = amount + fee;

  if (wallet.balance < totalDeducted) {
    return { success: false, wallet, error: `Insufficient balance. Need $${totalDeducted.toFixed(2)} (includes 10% fee)` };
  }

  wallet.balance -= totalDeducted;
  wallet.totalWithdrawn += amount;
  wallet.transactions.push({
    id: crypto.randomUUID(),
    type: 'withdrawal',
    amount: -totalDeducted,
    description: `Withdrew $${amount.toFixed(2)} (fee: $${fee.toFixed(2)})`,
    timestamp: Date.now(),
  });

  wallets[userId] = wallet;
  saveWallets(wallets);
  return { success: true, wallet };
}

export function deductForPurchase(userId: string, amount: number, description: string, relatedId?: string): { success: boolean; error?: string } {
  const wallets = getWallets();
  const wallet = wallets[userId];
  if (!wallet || wallet.balance < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  wallet.balance -= amount;
  wallet.transactions.push({
    id: crypto.randomUUID(),
    type: 'buy',
    amount: -amount,
    description,
    timestamp: Date.now(),
    relatedId,
  });

  wallets[userId] = wallet;
  saveWallets(wallets);
  return { success: true };
}

export function creditFromSale(userId: string, amount: number, description: string, relatedId?: string): void {
  const wallets = getWallets();
  const wallet = wallets[userId] || {
    userId,
    balance: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    transactions: [],
  };

  wallet.balance += amount;
  wallet.transactions.push({
    id: crypto.randomUUID(),
    type: 'sell',
    amount,
    description,
    timestamp: Date.now(),
    relatedId,
  });

  wallets[userId] = wallet;
  saveWallets(wallets);
}
