'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Thread, GroupThread, DirectThread, Message, GroupMember, DirectParticipant } from '../types';
import {
  seedCommsIfEmpty,
  getThreads,
  saveThreads,
  addThread,
  getMessages,
  saveMessages,
  addMessage as storeAddMessage,
  editMessage as storeEditMessage,
  deleteMessage as storeDeleteMessage,
  togglePinMessage as storeTogglePinMessage,
  toggleReaction as storeToggleReaction,
  markMessageRead as storeMarkMessageRead,
  searchMessages as storeSearchMessages,
  getUnreadMap,
  clearUnread,
  incrementUnread,
  getTypingUsers,
  setTyping as storeSetTyping,
  clearTyping as storeClearTyping,
  getContacts,
  Contact,
} from '../lib/comms-store';

interface CommsContextType {
  threads: (Thread | GroupThread | DirectThread)[];
  messages: Message[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string) => void;
  createGroupThread: (name: string, theme: string, invitedUsers: string[]) => void;
  createDirectThread: (username: string, initialMessage?: string) => void;
  sendMessage: (content: string, mentions?: string[]) => void;
  // New methods
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePin: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  markRead: (messageId: string) => void;
  searchMessages: (query: string, threadId?: string) => Message[];
  unreadMap: Record<string, number>;
  clearThreadUnread: (threadId: string) => void;
  typingUsers: { userId: string; userName: string }[];
  setTyping: () => void;
  contacts: Contact[];
  currentUserId: string;
  currentUserName: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>('thread_global');
  const [unreadMap, setUnreadMapState] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsersState] = useState<{ userId: string; userName: string }[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // On mount: seed localStorage if empty, then load persisted data into React state
  useEffect(() => {
    seedCommsIfEmpty();

    const storedThreads = getThreads();
    if (storedThreads.length > 0) {
      setThreads(storedThreads);
    } else {
      saveThreads([GLOBAL_THREAD]);
    }

    setMessages(getMessages());
    setUnreadMapState(getUnreadMap());
    setContacts(getContacts());
  }, []);

  // Periodically sync from localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const latest = getMessages();
      setMessages(prev => {
        if (latest.length !== prev.length) return latest;
        // Also check for modifications (edits, reactions, pins, deletes)
        const latestStr = JSON.stringify(latest);
        const prevStr = JSON.stringify(prev);
        if (latestStr !== prevStr) return latest;
        return prev;
      });
      const latestThreads = getThreads();
      setThreads(prev => {
        if (latestThreads.length !== prev.length) return latestThreads;
        return prev;
      });
      setUnreadMapState(getUnreadMap());
      setContacts(getContacts());

      // Update typing users for active thread
      if (activeThreadId) {
        const typing = getTypingUsers(activeThreadId)
          .filter(t => t.userId !== CURRENT_USER_ID);
        setTypingUsersState(typing.map(t => ({ userId: t.userId, userName: t.userName })));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeThreadId]);

  const setActiveThreadId = useCallback((id: string) => {
    setActiveThreadIdState(id);
    clearUnread(id);
    setUnreadMapState(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const createGroupThread = useCallback((name: string, theme: string, invitedUsers: string[]) => {
    if (!name?.trim()) return;

    const groupId = `thread_group_${Date.now()}`;
    const members: GroupMember[] = [
      { accountId: CURRENT_USER_ID, name: CURRENT_USER_NAME, status: 'owner' },
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

    addThread(newGroup);
    setThreads(prev => [...prev, newGroup]);
    setActiveThreadIdState(groupId);

    const systemMessage: Message = {
      id: `msg_${Date.now()}`,
      threadId: groupId,
      authorId: 'system',
      authorName: 'System',
      content: `Group "${name}" created`,
      timestamp: Date.now()
    };
    storeAddMessage(systemMessage);
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  const createDirectThread = useCallback((username: string, initialMessage?: string) => {
    if (!username?.trim()) return;
    const trimmedUsername = username.trim();

    const existingDM = threads.find(thread => {
      if (thread?.type !== 'direct') return false;
      return (thread as DirectThread).participants?.some(p => p?.name === trimmedUsername);
    });

    if (existingDM) {
      setActiveThreadIdState(existingDM.id);
      if (initialMessage?.trim()) {
        const msg: Message = {
          id: `msg_${Date.now()}`,
          threadId: existingDM.id,
          authorId: CURRENT_USER_ID,
          authorName: CURRENT_USER_NAME,
          content: initialMessage.trim(),
          timestamp: Date.now()
        };
        storeAddMessage(msg);
        setMessages(prev => [...prev, msg]);
      }
      return;
    }

    const dmId = `thread_dm_${Date.now()}`;
    const participants: DirectParticipant[] = [
      { accountId: CURRENT_USER_ID, name: CURRENT_USER_NAME },
      { accountId: `user_${Date.now()}`, name: trimmedUsername }
    ];
    const newDM: DirectThread = { id: dmId, name: trimmedUsername, type: 'direct', participants };

    addThread(newDM);
    setThreads(prev => [...prev, newDM]);
    setActiveThreadIdState(dmId);

    if (initialMessage?.trim()) {
      const msg: Message = {
        id: `msg_${Date.now()}`,
        threadId: dmId,
        authorId: CURRENT_USER_ID,
        authorName: CURRENT_USER_NAME,
        content: initialMessage.trim(),
        timestamp: Date.now()
      };
      storeAddMessage(msg);
      setMessages(prev => [...prev, msg]);
    }
  }, [threads]);

  const sendMessage = useCallback((content: string, mentions?: string[]) => {
    if (!activeThreadId || !content?.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      threadId: activeThreadId,
      authorId: CURRENT_USER_ID,
      authorName: CURRENT_USER_NAME,
      content: content.trim(),
      timestamp: Date.now(),
      mentions: mentions || [],
      readBy: [CURRENT_USER_ID],
    };

    storeAddMessage(newMessage);
    storeClearTyping(CURRENT_USER_ID, activeThreadId);
    setMessages(prev => [...prev, newMessage]);
  }, [activeThreadId]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!newContent?.trim()) return;
    storeEditMessage(messageId, newContent.trim());
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, content: newContent.trim(), isEdited: true } : m
    ));
  }, []);

  const deleteMessageFn = useCallback((messageId: string) => {
    storeDeleteMessage(messageId);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
    ));
  }, []);

  const togglePin = useCallback((messageId: string) => {
    storeTogglePinMessage(messageId);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
    ));
  }, []);

  const toggleReactionFn = useCallback((messageId: string, emoji: string) => {
    storeToggleReaction(messageId, emoji, CURRENT_USER_ID);
    // Re-read from store for accurate state
    setMessages(getMessages());
  }, []);

  const markRead = useCallback((messageId: string) => {
    storeMarkMessageRead(messageId, CURRENT_USER_ID);
  }, []);

  const searchMessagesFn = useCallback((query: string, threadId?: string): Message[] => {
    return storeSearchMessages(query, threadId);
  }, []);

  const clearThreadUnread = useCallback((threadId: string) => {
    clearUnread(threadId);
    setUnreadMapState(prev => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });
  }, []);

  const setTypingFn = useCallback(() => {
    if (!activeThreadId) return;
    storeSetTyping(CURRENT_USER_ID, CURRENT_USER_NAME, activeThreadId);
  }, [activeThreadId]);

  return (
    <CommsContext.Provider
      value={{
        threads,
        messages,
        activeThreadId,
        setActiveThreadId,
        createGroupThread,
        createDirectThread,
        sendMessage,
        editMessage,
        deleteMessage: deleteMessageFn,
        togglePin,
        toggleReaction: toggleReactionFn,
        markRead,
        searchMessages: searchMessagesFn,
        unreadMap,
        clearThreadUnread,
        typingUsers,
        setTyping: setTypingFn,
        contacts,
        currentUserId: CURRENT_USER_ID,
        currentUserName: CURRENT_USER_NAME,
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
