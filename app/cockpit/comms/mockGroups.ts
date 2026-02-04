export type GroupMemberStatus = 'owner' | 'admin' | 'member' | 'invited' | 'blocked';

export interface GroupMember {
  accountId: string;
  name: string;
  status: GroupMemberStatus;
}

export interface GroupThread {
  id: string;
  name: string;
  members: GroupMember[];
  theme: 'default' | 'alert' | 'stealth';
}

export const mockGroups: GroupThread[] = [
  {
    id: 'chat-group-ops',
    name: 'Ops Team',
    theme: 'default',
    members: [
      { accountId: 'acct-001', name: 'You', status: 'owner' },
      { accountId: 'acct-002', name: 'Alex Chen', status: 'admin' },
      { accountId: 'acct-003', name: 'Morgan Lee', status: 'member' },
    ],
  },
];
