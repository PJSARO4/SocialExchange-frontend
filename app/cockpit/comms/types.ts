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

// Reaction on a message
export interface Reaction {
  emoji: string;
  userIds: string[];
}

// Attachment on a message
export interface Attachment {
  id: string;
  type: 'image' | 'link';
  url: string;
  name?: string;
  previewUrl?: string;
}

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
  // New fields
  reactions?: Reaction[];
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  attachments?: Attachment[];
  readBy?: string[];
  mentions?: string[]; // userIds mentioned with @
}
