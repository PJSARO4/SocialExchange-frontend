'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Feed } from '../FeedsContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface CopilotAssistantProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  context?: {
    currentPage?: string;
    recentAction?: string;
    selectedContent?: any[];
  };
}

// Proactive messages based on context
const PROACTIVE_MESSAGES: Record<string, { trigger: string; message: string; suggestions: string[] }[]> = {
  autopilot: [
    {
      trigger: 'new_user',
      message: "👋 I see you're setting up Autopilot! This feature will post content automatically based on your schedule. Would you like me to help you configure it?",
      suggestions: ['Help me set up autopilot', 'What settings do you recommend?', 'How does autopilot work?'],
    },
    {
      trigger: 'low_content',
      message: "⚠️ I noticed your content library is running low. With your current posting schedule, you'll run out of content in about 5 days. Want me to help you plan ahead?",
      suggestions: ['Upload more content', 'Reduce posting frequency', 'Enable content recycling'],
    },
  ],
  scheduler: [
    {
      trigger: 'optimal_times',
      message: "📊 Based on your audience analytics, your followers are most active at 9am, 1pm, and 7pm. Would you like me to adjust your posting schedule?",
      suggestions: ['Yes, optimize my schedule', 'Show me the analytics', 'Keep current schedule'],
    },
  ],
  content: [
    {
      trigger: 'bulk_upload',
      message: "✨ Nice! I see you uploaded new content. Would you like me to generate AI captions for these images?",
      suggestions: ['Generate captions for all', 'Let me select which ones', 'No thanks'],
    },
  ],
  general: [
    {
      trigger: 'idle',
      message: "💡 Did you know? Accounts that post consistently see 3x more engagement. I can help you set up a posting routine!",
      suggestions: ['Tell me more', 'Set up posting routine', 'Show engagement tips'],
    },
  ],
};

export default function CopilotAssistant({
  feed,
  isOpen,
  onClose,
  context,
}: CopilotAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPresence, setShowPresence] = useState(true);
  const [presenceMessage, setPresenceMessage] = useState('');
  const [presenceSuggestions, setPresenceSuggestions] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Proactive presence based on context
  useEffect(() => {
    if (!context?.currentPage) return;

    const contextMessages = PROACTIVE_MESSAGES[context.currentPage] || PROACTIVE_MESSAGES.general;
    const randomMessage = contextMessages[Math.floor(Math.random() * contextMessages.length)];

    if (randomMessage) {
      setPresenceMessage(randomMessage.message);
      setPresenceSuggestions(randomMessage.suggestions);
    }
  }, [context?.currentPage]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hey there! 👋 I'm your Social Exchange Copilot. I'm here to help you manage @${feed.handle} like a pro. What would you like to do today?`,
          timestamp: new Date(),
          suggestions: [
            'Set up autopilot posting',
            'Generate captions for my content',
            'Analyze my best posting times',
            'Help me grow my engagement',
          ],
        },
      ]);
    }
  }, [feed.handle, messages.length]);

  // Send message to API
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: {
            feedId: feed.id,
            handle: feed.handle,
            platform: feed.platform,
            followers: feed.followers,
            engagement: feed.engagement,
            currentPage: context?.currentPage,
            ...context,
          },
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.message || data.content || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  // Handle suggestion click
  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Quick actions
  const quickActions = [
    { icon: '✍️', label: 'Write Caption', action: 'Help me write a caption for my next post' },
    { icon: '📅', label: 'Best Times', action: 'What are the best times to post?' },
    { icon: '📈', label: 'Growth Tips', action: 'Give me tips to grow my account' },
    { icon: '#️⃣', label: 'Hashtags', action: 'Suggest hashtags for my niche' },
  ];

  return (
    <>
      {/* Floating Presence Indicator (always visible when not in modal) */}
      {!isOpen && showPresence && (
        <div className="copilot-floating-presence" onClick={() => { onClose(); /* This triggers open */ }}>
          <div className="presence-bubble">
            <div className="presence-avatar">
              <div className="avatar-glow" />
              <span>🤖</span>
              <div className="status-dot" />
            </div>
            <div className="presence-content">
              <div className="presence-header">
                <span className="presence-name">Copilot</span>
                <span className="presence-status">Online • Ready to help</span>
              </div>
              {presenceMessage && (
                <p className="presence-message">{presenceMessage}</p>
              )}
              {presenceSuggestions.length > 0 && (
                <div className="presence-suggestions">
                  {presenceSuggestions.slice(0, 2).map((s, i) => (
                    <button key={i} className="presence-suggestion-btn">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="presence-dismiss"
              onClick={(e) => {
                e.stopPropagation();
                setShowPresence(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="presence-pulse" />
        </div>
      )}

      {/* Full Copilot Modal */}
      {isOpen && (
        <div className="copilot-modal-overlay">
          <div className="copilot-modal">
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-identity">
                <div className="copilot-avatar">
                  <span>🤖</span>
                  <div className="avatar-ring" />
                </div>
                <div className="copilot-info">
                  <h3>Copilot</h3>
                  <span className="copilot-status">
                    <span className="status-indicator" />
                    Online • Helping @{feed.handle}
                  </span>
                </div>
              </div>
              <div className="copilot-header-actions">
                <button className="header-btn" title="Clear chat">
                  🗑️
                </button>
                <button className="header-btn close-btn" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="copilot-quick-actions">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="quick-action-btn"
                  onClick={() => sendMessage(action.action)}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="copilot-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.role}`}>
                  {message.role === 'assistant' && (
                    <div className="message-avatar">🤖</div>
                  )}
                  <div className="message-content">
                    <p>{message.content}</p>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="message-suggestions">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            className="suggestion-btn"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message assistant typing">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="copilot-input-area">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything about your account..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                >
                  ➤
                </button>
              </div>
              <p className="input-hint">
                Press Enter to send • Copilot can help with captions, scheduling, analytics & more
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
