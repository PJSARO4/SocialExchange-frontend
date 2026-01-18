export type TransactionLogEntry = {
  id: string;
  type: string;
  assetId?: string;
  timestamp: number;
};

const LOG_KEY = 'transaction-log';

export function getTransactionLog(): TransactionLogEntry[] {
  const raw = localStorage.getItem(LOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logTransaction(entry: Omit<TransactionLogEntry, 'id' | 'timestamp'>) {
  const log = getTransactionLog();
  log.push({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...entry,
  });
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}
