export type ThreadType = 'group' | 'direct';

export interface DirectThread {
  id: string;
  type: 'direct';
  participants: {
    accountId: string;
    name: string;
  }[];
}

export const mockDirectThreads: DirectThread[] = [
  {
    id: 'chat-dm-alex',
    type: 'direct',
    participants: [
      { accountId: 'acct-001', name: 'You' },
      { accountId: 'acct-002', name: 'Alex Chen' },
    ],
  },
];
