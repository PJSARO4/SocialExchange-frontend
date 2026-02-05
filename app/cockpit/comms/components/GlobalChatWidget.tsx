'use client';

import { useState, useEffect, useRef } from 'react';
import { getMessagesByThread, addMessage, clearGlobalUnread, seedCommsIfEmpty } from '../lib/comms-store';
import './comms-enhanced.css';

interface GlobalMessage {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: number;
}

interface GlobalChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalChatWidget({ isOpen, onClose }: GlobalChatWidgetProps) {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const THREAD_ID = 'thread_global';

  useEffect(() => {
    seedCommsIfEmpty();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const msgs = getMessagesByThread(THREAD_ID);
      setMessages(msgs);
      clearGlobalUnread();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setMessages(getMessagesByThread(THREAD_ID));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    let userName = 'Operator';
    let userId = 'demo-user-main';
    try {
      const users = localStorage.getItem('sx_users');
      if (users) {
        const userList = JSON.parse(users);
        const currentUser = userList.find((u: { id: string }) => u.id === 'demo-user-main');
        if (currentUser) {
          userName = currentUser.displayName || 'Operator';
          userId = currentUser.id;
        }
      }
    } catch { /* ignore */ }

    const msg: GlobalMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      threadId: THREAD_ID,
      authorId: userId,
      authorName: userName,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="global-chat-widget">
      <div className="gcw-header">
        <span className="gcw-title">GLOBAL CHAT</span>
        <span className="gcw-online">{messages.length > 0 ? 'LIVE' : 'IDLE'}</span>
        <button className="gcw-close" onClick={onClose}>X</button>
      </div>
      <div className="gcw-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`gcw-message ${msg.authorId === 'system' ? 'system' : ''}`}>
            <div className="gcw-message-header">
              <span className="gcw-author">{msg.authorName}</span>
              <span className="gcw-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="gcw-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="gcw-input-area" onSubmit={handleSend}>
        <input
          type="text"
          className="gcw-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message global..."
          autoFocus
        />
        <button type="submit" className="gcw-send">SEND</button>
      </form>
    </div>
  );
}
