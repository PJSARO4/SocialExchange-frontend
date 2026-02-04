/**
 * SExCOINS Wallet Service
 *
 * Handles all wallet operations:
 * - Deposit USD → SExCOINS
 * - Withdraw SExCOINS → USD (with 10% fee)
 * - Balance tracking
 * - Transaction history
 *
 * ⚠️ DEMO MODE - Uses simulated transactions
 */

import {
  SEXCOIN_USD_RATE,
  WITHDRAWAL_FEE_PERCENT,
  usdToCoins,
  coinsToUsd,
  IS_DEMO_MODE,
} from './constants';
import { logger } from '@/lib/logging/activity-logger';
import type {
  WalletBalance,
  WalletTransaction,
  DepositRequest,
  DepositResult,
  WithdrawalRequest,
  WithdrawalResult,
} from './types';

// In-memory store for demo mode
// In production, this would use Prisma/database
const demoWallets = new Map<string, {
  balance: number;
  lockedBalance: number;
  transactions: WalletTransaction[];
}>();

/**
 * Get or create a wallet for a user
 */
export async function getOrCreateWallet(userId: string): Promise<WalletBalance> {
  if (IS_DEMO_MODE) {
    if (!demoWallets.has(userId)) {
      // Create new wallet with ZERO balance - users must deposit
      demoWallets.set(userId, {
        balance: 0,
        lockedBalance: 0,
        transactions: [],
      });
    }

    const wallet = demoWallets.get(userId)!;
    return {
      available: wallet.balance,
      locked: wallet.lockedBalance,
      total: wallet.balance + wallet.lockedBalance,
      usdValue: coinsToUsd(wallet.balance + wallet.lockedBalance),
    };
  }

  // Production: Use Prisma
  // const wallet = await prisma.wallet.upsert({
  //   where: { userId },
  //   create: { userId, balance: 0, lockedBalance: 0 },
  //   update: {},
  // });
  // return mapWalletToBalance(wallet);

  throw new Error('Production mode not implemented');
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
  return getOrCreateWallet(userId);
}

/**
 * Deposit USD to receive SExCOINS
 * Rate: 1 SExCOIN = $0.10 USD
 */
export async function depositFunds(
  userId: string,
  request: DepositRequest
): Promise<DepositResult> {
  const { usdAmount, paymentMethod } = request;

  if (usdAmount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  if (usdAmount < 1) {
    return { success: false, error: 'Minimum deposit is $1.00' };
  }

  if (usdAmount > 10000) {
    return { success: false, error: 'Maximum deposit is $10,000' };
  }

  const coinsToAdd = usdToCoins(usdAmount);

  if (IS_DEMO_MODE) {
    // Demo mode - instant deposit
    const wallet = await getOrCreateWallet(userId);
    const walletData = demoWallets.get(userId)!;

    const transaction: WalletTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'DEPOSIT',
      amount: coinsToAdd,
      balanceBefore: walletData.balance,
      balanceAfter: walletData.balance + coinsToAdd,
      usdAmount,
      description: `Deposited ${usdAmount.toFixed(2)} USD via ${paymentMethod} (DEMO)`,
      createdAt: new Date(),
    };

    walletData.balance += coinsToAdd;
    walletData.transactions.unshift(transaction);

    // Log the deposit
    logger.market.deposit(userId, 'Demo User', usdAmount, coinsToAdd);

    return {
      success: true,
      coinsReceived: coinsToAdd,
      transactionId: transaction.id,
    };
  }

  // Production: Process real payment via Stripe/PayPal
  // 1. Create payment intent
  // 2. Wait for confirmation
  // 3. Credit wallet
  // 4. Record transaction

  throw new Error('Production deposits not implemented');
}

/**
 * Withdraw SExCOINS to receive USD
 * Fee: 10% of withdrawal amount
 */
export async function withdrawFunds(
  userId: string,
  request: WithdrawalRequest
): Promise<WithdrawalResult> {
  const { coinAmount, payoutMethod } = request;

  if (coinAmount <= 0) {
    return { success: false, error: 'Amount must be positive' };
  }

  const wallet = await getOrCreateWallet(userId);

  if (coinAmount > wallet.available) {
    return {
      success: false,
      error: `Insufficient balance. Available: ${wallet.available.toFixed(2)} coins`,
    };
  }

  // Calculate fee and payout
  const feeCoins = coinAmount * (WITHDRAWAL_FEE_PERCENT / 100);
  const netCoins = coinAmount - feeCoins;
  const usdPayout = coinsToUsd(netCoins);

  if (usdPayout < 1) {
    return { success: false, error: 'Minimum withdrawal is $1.00 after fees' };
  }

  if (IS_DEMO_MODE) {
    const walletData = demoWallets.get(userId)!;

    const transaction: WalletTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'WITHDRAWAL',
      amount: coinAmount,
      balanceBefore: walletData.balance,
      balanceAfter: walletData.balance - coinAmount,
      usdAmount: usdPayout,
      feeAmount: feeCoins,
      description: `Withdrew ${coinAmount.toFixed(2)} coins (${WITHDRAWAL_FEE_PERCENT}% fee) via ${payoutMethod} (DEMO)`,
      createdAt: new Date(),
    };

    walletData.balance -= coinAmount;
    walletData.transactions.unshift(transaction);

    // Log the withdrawal
    logger.market.withdrawal(userId, 'Demo User', coinAmount, usdPayout);

    return {
      success: true,
      usdReceived: usdPayout,
      feeAmount: feeCoins,
      transactionId: transaction.id,
    };
  }

  // Production: Process real payout
  throw new Error('Production withdrawals not implemented');
}

/**
 * Lock coins for a pending order
 */
export async function lockCoins(userId: string, amount: number): Promise<boolean> {
  const wallet = await getOrCreateWallet(userId);

  if (amount > wallet.available) {
    return false;
  }

  if (IS_DEMO_MODE) {
    const walletData = demoWallets.get(userId)!;
    walletData.balance -= amount;
    walletData.lockedBalance += amount;
    return true;
  }

  throw new Error('Production lock not implemented');
}

/**
 * Unlock coins (order cancelled)
 */
export async function unlockCoins(userId: string, amount: number): Promise<boolean> {
  if (IS_DEMO_MODE) {
    const walletData = demoWallets.get(userId);
    if (!walletData || amount > walletData.lockedBalance) {
      return false;
    }
    walletData.lockedBalance -= amount;
    walletData.balance += amount;
    return true;
  }

  throw new Error('Production unlock not implemented');
}

/**
 * Spend locked coins (order filled)
 */
export async function spendLockedCoins(
  userId: string,
  amount: number,
  description: string
): Promise<WalletTransaction | null> {
  if (IS_DEMO_MODE) {
    const walletData = demoWallets.get(userId);
    if (!walletData || amount > walletData.lockedBalance) {
      return null;
    }

    const transaction: WalletTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'BUY_SHARES',
      amount,
      balanceBefore: walletData.balance + walletData.lockedBalance,
      balanceAfter: walletData.balance + walletData.lockedBalance - amount,
      description,
      createdAt: new Date(),
    };

    walletData.lockedBalance -= amount;
    walletData.transactions.unshift(transaction);

    return transaction;
  }

  throw new Error('Production spend not implemented');
}

/**
 * Credit coins to wallet (from selling shares)
 */
export async function creditCoins(
  userId: string,
  amount: number,
  type: 'SELL_SHARES' | 'CREATOR_ROYALTY' | 'REFUND',
  description: string
): Promise<WalletTransaction | null> {
  if (IS_DEMO_MODE) {
    await getOrCreateWallet(userId);  // Ensure wallet exists
    const walletData = demoWallets.get(userId)!;

    const transaction: WalletTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      amount,
      balanceBefore: walletData.balance,
      balanceAfter: walletData.balance + amount,
      description,
      createdAt: new Date(),
    };

    walletData.balance += amount;
    walletData.transactions.unshift(transaction);

    return transaction;
  }

  throw new Error('Production credit not implemented');
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<WalletTransaction[]> {
  if (IS_DEMO_MODE) {
    await getOrCreateWallet(userId);
    const walletData = demoWallets.get(userId)!;
    return walletData.transactions.slice(offset, offset + limit);
  }

  throw new Error('Production history not implemented');
}

/**
 * Deduct IPO fee
 */
export async function deductIPOFee(userId: string): Promise<WalletTransaction | null> {
  const IPO_FEE = 1000; // From constants

  const wallet = await getOrCreateWallet(userId);

  if (wallet.available < IPO_FEE) {
    return null;
  }

  if (IS_DEMO_MODE) {
    const walletData = demoWallets.get(userId)!;

    const transaction: WalletTransaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'IPO_FEE',
      amount: IPO_FEE,
      balanceBefore: walletData.balance,
      balanceAfter: walletData.balance - IPO_FEE,
      description: 'IPO listing fee - 1000 SExCOINS',
      createdAt: new Date(),
    };

    walletData.balance -= IPO_FEE;
    walletData.transactions.unshift(transaction);

    return transaction;
  }

  throw new Error('Production IPO fee not implemented');
}
