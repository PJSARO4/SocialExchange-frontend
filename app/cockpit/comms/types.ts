export type ThreadType = 'global' | 'group' | 'direct';

export interface Thread {
  id: string;
  name: string;
  type: ThreadType;
}

export interface GroupMember {
  accountId: string;
  name: string;
  status: 'owner' | 'member' | 'invited';
}

export interface GroupThread extends Thread {
  type: 'group';
  theme: string;
  members: GroupMember[];
}

export interface DirectParticipant {
  accountId: string;
  name: string;
}

export interface DirectThread extends Thread {
  type: 'direct';
  participants: DirectParticipant[];
}

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}