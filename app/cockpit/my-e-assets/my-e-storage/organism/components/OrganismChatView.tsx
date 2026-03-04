'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrganism } from '@/app/context/OrganismContext';

// ============================================
// CHAT VIEW — Conversational interface with SYN
// ============================================

const QUICK_PROMPTS = [
  'Compress all images',
  'Organize my files',
  'Find trending content',
  'Tag my files',
  'Storage status',
  'Help',
];

export default function OrganismChatView() {
  const { chatHistory, sendMessage, isProcessing, clearChat, config, runTask } =
    useOrganism();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory.length, isProcessing]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isProcessing) return;
    setInput('');
    await sendMessage(msg);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isProcessing) return;
    await sendMessage(prompt);
  };

  const handleActionClick = (type: string, payload?: string) => {
    // Execute tasks directly instead of re-sending chat messages
    if (type === 'compress') {
      runTask({
        type: 'compress',
        description: payload ? `Compress for ${payload}` : 'Compress all images',
        targetItems: [], // Will compress all if empty array handled in context
      });
    } else if (type === 'organize') {
      runTask({
        type: 'organize',
        description: 'Organize files by type',
      });
    } else if (type === 'scrape') {
      runTask({
        type: 'scrape',
        description: `Find ${payload || 'trending content'}`,
      });
    } else if (type === 'tag') {
      runTask({
        type: 'tag',
        description: 'Auto-tag all files',
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div className="orgo-chat-messages">
        {chatHistory.length === 0 && (
          <div className="orgo-chat-message system">
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {'🔮'}
            </div>
            <div>
              {config.name} is online. Ask me anything about your vault, or use
              the quick actions below.
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id}>
            <div className={`orgo-chat-message ${msg.role}`}>
              {msg.content}
            </div>
            {msg.actions && msg.actions.length > 0 && (
              <div className="orgo-chat-actions">
                {msg.actions.map((action) => (
                  <button
                    key={action.id}
                    className="orgo-chat-action-btn"
                    onClick={() =>
                      handleActionClick(action.type, action.payload)
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="orgo-chat-typing">
            <span />
            <span />
            <span />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips */}
      <div className="orgo-quick-chips">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="orgo-quick-chip"
            onClick={() => handleQuickPrompt(prompt)}
            disabled={isProcessing}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="orgo-chat-input-area">
        <input
          type="text"
          className="orgo-chat-input"
          placeholder={`Ask ${config.name}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isProcessing}
        />
        <button
          className="orgo-chat-send"
          onClick={handleSend}
          disabled={isProcessing || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
