'use client';

import { useState, useEffect, useRef } from 'react';
import { useComms } from '../context/CommsContext';
import MessageItem from './MessageItem';
import QuickReplyTemplates from './QuickReplyTemplates';
import { GroupThread, DirectThread } from '../types';

export default function RightPanel() {
  const { threads, messages, activeThreadId, sendMessage } = useComms();
  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads?.find(t => t?.id === activeThreadId) || null;
  const threadMessages = messages?.filter(m => m?.threadId === activeThreadId) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  if (!activeThread) {
    return (
      <div className="comms-right-panel">
        <div className="comms-empty-state">
          <div className="comms-empty-text">SELECT CHANNEL</div>
        </div>
      </div>
    );
  }

  let subtitle = '';
  if (activeThread.type === 'group') {
    const groupThread = activeThread as GroupThread;
    subtitle = `${groupThread.members?.length || 0} members • ${groupThread.theme || 'general'}`;
  } else if (activeThread.type === 'direct') {
    const dmThread = activeThread as DirectThread;
    subtitle = `Direct message with ${dmThread.name || 'Unknown'}`;
  } else {
    subtitle = 'System-wide communications';
  }

  return (
    <div className="comms-right-panel">
      <div className="comms-thread-header">
        <div className="comms-thread-title">{activeThread.name || 'Unknown Channel'}</div>
        <div className="comms-thread-subtitle">{subtitle}</div>
      </div>

      <div className="comms-messages-container">
        {threadMessages.length === 0 ? (
          <div className="comms-no-messages">
            <div className="comms-no-messages-text">NO MESSAGES</div>
          </div>
        ) : (
          threadMessages.map(message => (
            <MessageItem key={message?.id || Math.random()} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showTemplates && (
        <QuickReplyTemplates
          onSelectTemplate={(content) => {
            setInputValue(content);
            setShowTemplates(false);
          }}
        />
      )}

      <form className="comms-input-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="comms-send-button"
          onClick={() => setShowTemplates(!showTemplates)}
          style={{ marginRight: '0.25rem', fontSize: '0.65rem', padding: '0.4rem 0.6rem', opacity: showTemplates ? 1 : 0.7 }}
          title="Quick Reply Templates"
        >
          TEMPLATES
        </button>
        <input
          type="text"
          className="comms-message-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Message ${activeThread.name || 'channel'}...`}
        />
        <button type="submit" className="comms-send-button">
          SEND
        </button>
      </form>
    </div>
  );
}