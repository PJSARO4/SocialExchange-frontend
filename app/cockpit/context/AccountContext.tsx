'use client';

import { createContext, useContext } from 'react';

export interface Account {
  id: string;
  name: string;
}

const AccountContext = createContext<Account | null>(null);

export function AccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // MOCKED ACCOUNT — safe to replace later
  const account: Account = {
    id: 'acct-001',
    name: 'You',
  };

  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  return ctx;
}
