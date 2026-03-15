'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pin, Search, Zap } from 'lucide-react';
import { useComms } from '../context/CommsContext';
import MessageItem from './MessageItem';
import QuickReplyTemplates from './QuickReplyTemplates';
import { GroupThread, DirectThread, Message } from '../types';

export default function RightPanel() {
  const {
    threads, messages, activeThreadId, sendMessage, searchMessages,
    typingUsers, setTyping, contacts, togglePin,
  } = useComms();

  const [inputValue, setInputValue] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showPinned, setShowPinned] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeThread = threads?.find(t => t?.id === activeThreadId) || null;
  const threadMessages = messages?.filter(m => m?.threadId === activeThreadId) || [];
  const pinnedMessages = threadMessages.filter(m => m.isPinned);

  // Filtered contacts for @mention autocomplete
  const mentionCandidates = contacts
    .filter(c => !c.isBlocked)
    .filter(c => mentionFilter ? c.name.toLowerCase().includes(mentionFilter.toLowerCase()) || c.username.toLowerCase().includes(mentionFilter.toLowerCase()) : true)
    .slice(0, 5);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length, activeThreadId]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setSearchResults(searchMessages(searchQuery, activeThreadId || undefined));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchMessages, activeThreadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Extract @mentions from message
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(inputValue)) !== null) {
      const contact = contacts.find(c => c.username === match[1] || c.name === match[1]);
      if (contact) mentions.push(contact.userId);
    }

    sendMessage(inputValue, mentions);
    setInputValue('');
    setShowMentions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Typing indicator
    setTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 3000);

    // @mention detection
    const cursorPos = e.target.selectionStart || 0;
    const textBefore = val.slice(0, cursorPos);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      setShowMentions(true);
      setMentionFilter(mentionMatch[1]);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => Math.min(prev + 1, mentionCandidates.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (showMentions) {
          e.preventDefault();
          insertMention(mentionCandidates[mentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const insertMention = useCallback((contact: typeof contacts[0]) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBefore = inputValue.slice(0, cursorPos);
    const textAfter = inputValue.slice(cursorPos);
    const beforeMention = textBefore.replace(/@\w*$/, '');
    const newValue = `${beforeMention}@${contact.username} ${textAfter}`;
    setInputValue(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  }, [inputValue]);

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
    subtitle = `${groupThread.members?.length || 0} members · ${groupThread.theme || 'general'}`;
  } else if (activeThread.type === 'direct') {
    subtitle = `Direct message with ${activeThread.name || 'Unknown'}`;
  } else {
    subtitle = 'System-wide communications';
  }

  return (
    <div className="comms-right-panel">
      {/* Thread header with search and pin toggles */}
      <div className="comms-thread-header">
        <div className="comms-thread-header-left">
          <div className="comms-thread-title">{activeThread.name || 'Unknown Channel'}</div>
          <div className="comms-thread-subtitle">{subtitle}</div>
        </div>
        <div className="comms-thread-header-actions">
          {pinnedMessages.length > 0 && (
            <button
              className={`comms-header-btn ${showPinned ? 'active' : ''}`}
              onClick={() => setShowPinned(!showPinned)}
              title={`${pinnedMessages.length} pinned`}
            >
              <Pin size={14} /> {pinnedMessages.length}
            </button>
          )}
          <button
            className={`comms-header-btn ${showSearch ? 'active' : ''}`}
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}
            title="Search messages"
          >
            <Search size={14} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="comms-search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="comms-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            onKeyDown={e => e.key === 'Escape' && setShowSearch(false)}
          />
          {searchResults.length > 0 && (
            <div className="comms-search-results">
              <div className="comms-search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
              {searchResults.slice(0, 10).map(msg => (
                <div key={msg.id} className="comms-search-result-item">
                  <span className="comms-search-result-author">{msg.authorName}</span>
                  <span className="comms-search-result-preview">{msg.content.slice(0, 80)}{msg.content.length > 80 ? '...' : ''}</span>
                  <span className="comms-search-result-time">
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pinned messages bar */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="comms-pinned-bar">
          <div className="comms-pinned-title"><Pin size={14} /> Pinned Messages</div>
          {pinnedMessages.map(msg => (
            <div key={msg.id} className="comms-pinned-item">
              <div className="comms-pinned-item-header">
                <span className="comms-pinned-item-author">{msg.authorName}</span>
                <button className="comms-pinned-unpin" onClick={() => togglePin(msg.id)} title="Unpin">✕</button>
              </div>
              <div className="comms-pinned-item-content">{msg.content.slice(0, 120)}{msg.content.length > 120 ? '...' : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
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

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="comms-typing-indicator">
          <div className="comms-typing-dots">
            <span /><span /><span />
          </div>
          <span className="comms-typing-text">
            {typingUsers.map(t => t.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <QuickReplyTemplates
          onSelectTemplate={(content) => {
            setInputValue(content);
            setShowTemplates(false);
          }}
        />
      )}

      {/* @Mention autocomplete dropdown */}
      {showMentions && mentionCandidates.length > 0 && (
        <div className="comms-mention-dropdown">
          {mentionCandidates.map((contact, i) => (
            <div
              key={contact.id}
              className={`comms-mention-option ${i === mentionIndex ? 'active' : ''}`}
              onClick={() => insertMention(contact)}
              onMouseEnter={() => setMentionIndex(i)}
            >
              <span className="comms-mention-avatar">{contact.name.charAt(0)}</span>
              <div className="comms-mention-info">
                <span className="comms-mention-name">{contact.name}</span>
                <span className="comms-mention-username">@{contact.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form className="comms-input-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="comms-toolbar-btn"
          onClick={() => setShowTemplates(!showTemplates)}
          title="Quick Reply Templates"
        >
          <Zap size={14} />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="comms-message-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={`Message ${activeThread.name || 'channel'}... (type @ to mention)`}
        />
        <button type="submit" className="comms-send-button">
          SEND
        </button>
      </form>
    </div>
  );
}
