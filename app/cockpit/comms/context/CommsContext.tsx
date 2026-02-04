'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Thread, GroupThread, DirectThread, Message, GroupMember, DirectParticipant } from '../types';

interface CommsContextType {
  threads: (Thread | GroupThread | DirectThread)[];
  messages: Message[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string) => void;
  createGroupThread: (name: string, theme: string, invitedUsers: string[]) => void;
  createDirectThread: (username: string, initialMessage?: string) => void;
  sendMessage: (content: string) => void;
}

const CommsContext = createContext<CommsContextType | undefined>(undefined);

const CURRENT_USER_ID = 'user_current';
const CURRENT_USER_NAME = 'Command Center';

const GLOBAL_THREAD: Thread = {
  id: 'thread_global',
  name: 'Global',
  type: 'global'
};

export function CommsProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<(Thread | GroupThread | DirectThread)[]>([GLOBAL_THREAD]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      threadId: 'thread_global',
      authorId: 'system',
      authorName: 'System',
      content: 'Global communications channel active',
      timestamp: Date.now() - 3600000
    }
  ]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>('thread_global');

  const createGroupThread = (name: string, theme: string, invitedUsers: string[]) => {
    if (!name?.trim()) return;
    
    const groupId = `thread_group_${Date.now()}`;
    
    const members: GroupMember[] = [
      {
        accountId: CURRENT_USER_ID,
        name: CURRENT_USER_NAME,
        status: 'owner'
      },
      ...invitedUsers.filter(Boolean).map((username, idx) => ({
        accountId: `user_${Date.now()}_${idx}`,
        name: username.trim(),
        status: 'invited' as const
      }))
    ];

    const newGroup: GroupThread = {
      id: groupId,
      name: name.trim(),
      type: 'group',
      theme: theme || 'general',
      members
    };

    setThreads(prev => [...prev, newGroup]);
    setActiveThreadId(groupId);

    const systemMessage: Message = {
      id: `msg_${Date.now()}`,
      threadId: groupId,
      authorId: 'system',
      authorName: 'System',
      content: `Group "${name}" created`,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, systemMessage]);
  };

  const createDirectThread = (username: string, initialMessage?: string) => {
    if (!username?.trim()) return;
    
    const trimmedUsername = username.trim();
    
    const existingDM = threads.find(thread => {
      if (thread?.type !== 'direct') return false;
      const dmThread = thread as DirectThread;
      return dmThread.participants?.some(p => p?.name === trimmedUsername);
    });

    if (existingDM) {
      setActiveThreadId(existingDM.id);
      if (initialMessage?.trim()) {
        const msg: Message = {
          id: `msg_${Date.now()}`,
          threadId: existingDM.id,
          authorId: CURRENT_USER_ID,
          authorName: CURRENT_USER_NAME,
          content: initialMessage.trim(),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, msg]);
      }
      return;
    }

    const dmId = `thread_dm_${Date.now()}`;

    const participants: DirectParticipant[] = [
      {
        accountId: CURRENT_USER_ID,
        name: CURRENT_USER_NAME
      },
      {
        accountId: `user_${Date.now()}`,
        name: trimmedUsername
      }
    ];

    const newDM: DirectThread = {
      id: dmId,
      name: trimmedUsername,
      type: 'direct',
      participants
    };

    setThreads(prev => [...prev, newDM]);
    setActiveThreadId(dmId);

    if (initialMessage?.trim()) {
      const msg: Message = {
        id: `msg_${Date.now()}`,
        threadId: dmId,
        authorId: CURRENT_USER_ID,
        authorName: CURRENT_USER_NAME,
        content: initialMessage.trim(),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, msg]);
    }
  };

  const sendMessage = (content: string) => {
    if (!activeThreadId || !content?.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      threadId: activeThreadId,
      authorId: CURRENT_USER_ID,
      authorName: CURRENT_USER_NAME,
      content: content.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <CommsContext.Provider
      value={{
        threads,
        messages,
        activeThreadId,
        setActiveThreadId,
        createGroupThread,
        createDirectThread,
        sendMessage
      }}
    >
      {children}
    </CommsContext.Provider>
  );
}

export function useComms() {
  const context = useContext(CommsContext);
  if (!context) {
    throw new Error('useComms must be used within CommsProvider');
  }
  return context;
}