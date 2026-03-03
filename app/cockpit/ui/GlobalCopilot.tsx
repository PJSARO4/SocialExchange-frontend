'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './global-copilot.css';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: CopilotAction[];
}

interface CopilotAction {
  id: string;
  label: string;
  type: 'navigate' | 'action' | 'link';
  payload?: string;
}

interface QuickPrompt {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  category: string;
}

// ============================================
// CONTEXT-AWARE PROMPTS
// ============================================

const CONTEXT_PROMPTS: Record<string, QuickPrompt[]> = {
  dashboard: [
    { id: 'overview', icon: '📊', label: 'System Overview', prompt: 'Give me an overview of my Social Exchange status', category: 'info' },
    { id: 'tips', icon: '💡', label: 'Quick Tips', prompt: 'What should I focus on today?', category: 'strategy' },
    { id: 'alerts', icon: '🔔', label: 'Check Alerts', prompt: 'Are there any important alerts or notifications?', category: 'info' },
    { id: 'performance', icon: '📈', label: 'Performance', prompt: 'How is my overall performance?', category: 'analytics' },
  ],
  market: [
    { id: 'market-trends', icon: '📈', label: 'Market Trends', prompt: 'What are the current market trends?', category: 'market' },
    { id: 'buy-advice', icon: '💰', label: 'Investment Tips', prompt: 'What creators should I consider investing in?', category: 'market' },
    { id: 'portfolio', icon: '💼', label: 'Portfolio Review', prompt: 'Review my portfolio and suggest improvements', category: 'market' },
    { id: 'ipo-help', icon: '🚀', label: 'IPO Help', prompt: 'How do I go public with my brand?', category: 'market' },
  ],
  feeds: [
    { id: 'content-ideas', icon: '💡', label: 'Content Ideas', prompt: 'Give me 10 content ideas for this week', category: 'content' },
    { id: 'growth-plan', icon: '📈', label: 'Growth Plan', prompt: 'Create a 30-day growth plan for my account', category: 'growth' },
    { id: 'schedule', icon: '📅', label: 'Best Times', prompt: 'What are the best times to post?', category: 'automation' },
    { id: 'automation', icon: '🤖', label: 'Automation', prompt: 'Help me set up automation for my feeds', category: 'automation' },
  ],
  'e-assets': [
    { id: 'asset-overview', icon: '📊', label: 'Asset Overview', prompt: 'Give me an overview of my e-assets', category: 'info' },
    { id: 'optimize', icon: '⚡', label: 'Optimize', prompt: 'How can I optimize my digital assets?', category: 'strategy' },
    { id: 'value', icon: '💎', label: 'Valuation', prompt: 'What is my total asset value?', category: 'info' },
    { id: 'grow', icon: '🌱', label: 'Grow Assets', prompt: 'How can I grow my e-asset portfolio?', category: 'strategy' },
  ],
  trading: [
    { id: 'trade-tips', icon: '💹', label: 'Trade Tips', prompt: 'What trading opportunities should I consider?', category: 'market' },
    { id: 'analyze', icon: '🔍', label: 'Analysis', prompt: 'Analyze the current trading conditions', category: 'analytics' },
    { id: 'risk', icon: '⚠️', label: 'Risk Check', prompt: 'What risks should I be aware of?', category: 'market' },
    { id: 'strategy', icon: '🎯', label: 'Strategy', prompt: 'What trading strategy would you recommend?', category: 'strategy' },
  ],
  default: [
    { id: 'help', icon: '❓', label: 'Get Help', prompt: 'What can you help me with?', category: 'help' },
    { id: 'navigate', icon: '🧭', label: 'Navigate', prompt: 'Help me navigate Social Exchange', category: 'help' },
    { id: 'tips', icon: '💡', label: 'Tips', prompt: 'Give me some tips to get started', category: 'strategy' },
    { id: 'features', icon: '⭐', label: 'Features', prompt: 'What features does Social Exchange offer?', category: 'help' },
  ],
};

// ============================================
// AI RESPONSE ENGINE
// ============================================

const getContextFromPath = (pathname: string): string => {
  if (pathname.includes('dashboard')) return 'dashboard';
  if (pathname.includes('market')) return 'market';
  if (pathname.includes('feeds') || pathname.includes('my-feeds')) return 'feeds';
  if (pathname.includes('e-assets') || pathname.includes('e-shares')) return 'e-assets';
  if (pathname.includes('trading')) return 'trading';
  return 'default';
};

const getAIResponse = (input: string, context: string): { content: string; actions?: CopilotAction[] } => {
  const lowerInput = input.toLowerCase();

  // Navigation help
  if (lowerInput.includes('navigate') || lowerInput.includes('where') || lowerInput.includes('find')) {
    return {
      content: `**Social Exchange Navigation** 🧭\n\nHere's where to find things:\n\n• **Command Center** - Your main dashboard with overview stats\n• **My E-Assets** - Manage feeds and digital shares\n• **Trading Post** - Buy and sell digital assets\n• **Market** - Invest in creators with SExCOINS\n• **Comms** - Messages and communications\n\nWhat would you like to explore?`,
      actions: [
        { id: 'go-dashboard', label: 'Command Center', type: 'navigate', payload: '/cockpit/dashboard' },
        { id: 'go-assets', label: 'My E-Assets', type: 'navigate', payload: '/cockpit/my-e-assets' },
        { id: 'go-market', label: 'Market', type: 'navigate', payload: '/cockpit/market' },
      ],
    };
  }

  // Help / capabilities
  if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
    return {
      content: `**I'm your Social Exchange Copilot!** 🤖\n\nI can help you with:\n\n**📱 Social Media**\n• Content ideas and scheduling\n• Growth strategies\n• Analytics insights\n• Automation setup\n\n**💰 Market & Trading**\n• Investment guidance\n• Portfolio management\n• IPO assistance\n• Market analysis\n\n**🎯 Strategy**\n• Brand development\n• Audience growth\n• Monetization tips\n• Competitor analysis\n\n**🔧 Platform**\n• Navigation help\n• Feature explanations\n• Troubleshooting\n\nJust ask me anything!`,
    };
  }

  // Market-related
  if (lowerInput.includes('market') || lowerInput.includes('invest') || lowerInput.includes('sexcoin')) {
    return {
      content: `**SExCOINS Market** 💰\n\nThe market lets you invest in creators:\n\n**How it works:**\n• Buy SExCOINS with USD ($0.10 per coin)\n• Use coins to buy shares in creators\n• Prices move based on supply/demand\n• Cash out anytime (10% fee)\n\n**Creator IPO:**\n• Creators can "go public" for 1,000 coins ($100)\n• Set your own ticker and initial price\n• Earn 2% royalty on every trade\n\nWant me to help you get started?`,
      actions: [
        { id: 'go-market', label: 'Open Market', type: 'navigate', payload: '/cockpit/market' },
        { id: 'learn-ipo', label: 'Learn About IPO', type: 'action', payload: 'ipo-info' },
      ],
    };
  }

  // SYN Organism clipboard — user asks about clipped items
  if (lowerInput.includes('clip') || lowerInput.includes('syn') || lowerInput.includes('organism')) {
    let clipInfo = '';
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('sx_organism_clipboard') : null;
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items) && items.length > 0) {
          clipInfo = items.slice(0, 5).map((i: any) => `• **${i.title}** (${i.type})`).join('\n');
        }
      }
    } catch { /* ignore */ }

    if (clipInfo) {
      return {
        content: `**SYN Clipboard** 📋\n\nItems SYN has clipped for you:\n\n${clipInfo}\n\nYou can use these in your next post or schedule them.`,
        actions: [
          { id: 'go-storage', label: 'Open E-Storage', type: 'navigate', payload: '/cockpit/my-e-assets/my-e-storage' },
          { id: 'go-feeds', label: 'Create Post', type: 'navigate', payload: '/cockpit/my-e-assets/my-feeds' },
        ],
      };
    }

    return {
      content: `**SYN Organism** 🧬\n\nSYN is your AI assistant living inside E-Storage. It can:\n\n• Compress images for social platforms\n• Auto-tag and organize your files\n• Find trending content\n• Clip items for use in Copilot\n\nVisit E-Storage to interact with SYN!`,
      actions: [
        { id: 'go-storage', label: 'Open E-Storage', type: 'navigate', payload: '/cockpit/my-e-assets/my-e-storage' },
      ],
    };
  }

  // Content/feeds related
  if (lowerInput.includes('content') || lowerInput.includes('post') || lowerInput.includes('idea')) {
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return {
      content: `**Content Ideas for ${dayOfWeek}** 💡\n\n**Quick Wins:**\n1. Behind-the-scenes of your process\n2. A tip your audience can use today\n3. Share a recent win or milestone\n4. Ask your audience a question\n5. Repurpose your best-performing content\n\n**Format Ideas:**\n• Carousel with actionable tips\n• Quick video tutorial\n• Relatable meme or trend\n• Story Q&A session\n• User-generated content feature\n\n**Caption Formula:**\nHook → Story → Value → Call-to-action\n\nWant more specific ideas for your niche?`,
      actions: [
        { id: 'more-ideas', label: 'More Ideas', type: 'action', payload: 'content-ideas' },
        { id: 'go-feeds', label: 'Open My Feeds', type: 'navigate', payload: '/cockpit/my-e-assets/my-feeds' },
      ],
    };
  }

  // Growth related
  if (lowerInput.includes('grow') || lowerInput.includes('follower') || lowerInput.includes('growth')) {
    return {
      content: `**Growth Strategy** 📈\n\n**Daily Actions:**\n• Post 1-2x at optimal times\n• Engage 30 minutes in your niche\n• Reply to all comments within 1 hour\n• Share 3-5 Stories\n\n**Weekly Goals:**\n• Collaborate with 1 similar creator\n• Test 1 new content format\n• Review analytics and adjust\n• Engage with larger accounts\n\n**Quick Wins:**\n• Optimize your bio with clear value prop\n• Use trending audio in Reels\n• Create saveable content (tips, guides)\n• Go live once per week\n\nWant a detailed 30-day growth plan?`,
      actions: [
        { id: 'growth-plan', label: '30-Day Plan', type: 'action', payload: 'growth-plan' },
        { id: 'go-analytics', label: 'View Analytics', type: 'navigate', payload: '/cockpit/my-e-assets/my-feeds' },
      ],
    };
  }

  // Automation
  if (lowerInput.includes('automat') || lowerInput.includes('schedule') || lowerInput.includes('autopilot')) {
    return {
      content: `**Automation Setup** 🤖\n\n**What we can automate:**\n\n✅ **Content Scheduling**\n• Queue posts days/weeks ahead\n• Auto-post at optimal times\n• Cross-post to multiple platforms\n\n✅ **Smart Timing**\n• Post when your audience is active\n• Adjust for time zones\n• Weekend vs weekday optimization\n\n✅ **Workflow**\n• Content approval flows\n• Team collaboration\n• Performance alerts\n\n**Control Modes:**\n• 🤖 Autopilot - Full automation\n• 🔒 Escrow - Needs approval\n• ✋ Manual - You control everything\n\nReady to set up automation?`,
      actions: [
        { id: 'setup-auto', label: 'Set Up Automation', type: 'navigate', payload: '/cockpit/my-e-assets/my-feeds' },
      ],
    };
  }

  // Context-specific default responses
  const contextResponses: Record<string, string> = {
    dashboard: `You're in the Command Center! 📊\n\nFrom here you can monitor your overall Social Exchange activity. What would you like to know about?\n\n• Account performance\n• Recent activity\n• Market updates\n• Upcoming scheduled posts`,
    market: `You're in the Trading Floor! 💹\n\nHere you can invest in creators and manage your portfolio. I can help with:\n\n• Finding creators to invest in\n• Understanding market trends\n• Managing your holdings\n• Going public with your brand`,
    feeds: `You're in My Feeds! 📱\n\nThis is your social media command center. I can help with:\n\n• Content ideas and scheduling\n• Growth strategies\n• Analytics and insights\n• Automation setup`,
    'e-assets': `You're in My E-Assets! 💎\n\nManage all your digital assets here. I can help with:\n\n• Understanding your portfolio\n• Optimizing your assets\n• Growing your brand value\n• Trading strategies`,
    trading: `You're in the Trading Post! 🏪\n\nBuy, sell, and trade digital assets. I can help with:\n\n• Finding good deals\n• Pricing your assets\n• Market analysis\n• Trading strategies`,
    default: `Welcome to Social Exchange! 🚀\n\nI'm here to help you navigate and succeed. What would you like to explore?\n\n• Social media management\n• Creator investments\n• Digital asset trading\n• Growth strategies`,
  };

  return {
    content: contextResponses[context] || contextResponses.default,
    actions: [
      { id: 'help', label: 'What Can You Do?', type: 'action', payload: 'help' },
      { id: 'navigate', label: 'Show Navigation', type: 'action', payload: 'navigate' },
    ],
  };
};

// ============================================
// COMPONENT
// ============================================

interface GlobalCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalCopilot({ isOpen, onClose }: GlobalCopilotProps) {
  const pathname = usePathname();
  const context = getContextFromPath(pathname);
  const quickPrompts = CONTEXT_PROMPTS[context] || CONTEXT_PROMPTS.default;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! 👋 I'm your Social Exchange Copilot. I can help you navigate the platform, grow your social presence, and manage your digital assets. What can I help you with?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Hide quick prompts after first message
  useEffect(() => {
    if (messages.filter(m => m.role === 'user').length > 0) {
      setShowQuickPrompts(false);
    }
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Read SYN organism clipboard for bridge context
  const getOrganismClipboard = (): string => {
    try {
      const raw = localStorage.getItem('sx_organism_clipboard');
      if (!raw) return '';
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) return '';
      return items
        .slice(0, 5)
        .map((i: any) => `${i.title} (${i.type}, tags: ${(i.tags || []).join(', ')})`)
        .join('; ');
    } catch {
      return '';
    }
  };

  // Call Anthropic API with fallback to local pattern matching
  const callCopilotAPI = async (userInput: string): Promise<{ content: string; actions?: CopilotAction[] }> => {
    try {
      const synClipboard = getOrganismClipboard();
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          context: {
            page: context,
            pathname,
            ...(synClipboard ? { synClipboard } : {}),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Copilot API error:', errorData.error || response.statusText);
        // Fallback to local response
        return getAIResponse(userInput, context);
      }

      const data = await response.json();
      return { content: data.reply || 'I apologize, I could not generate a response.' };
    } catch (error) {
      console.warn('Copilot API unavailable, using local fallback:', error);
      // Fallback to local response
      return getAIResponse(userInput, context);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);

    const response = await callCopilotAPI(currentInput);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickPrompt = async (prompt: QuickPrompt) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt.prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setShowQuickPrompts(false);
    setIsTyping(true);

    const response = await callCopilotAPI(prompt.prompt);

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleAction = (action: CopilotAction) => {
    if (action.type === 'navigate' && action.payload) {
      window.location.href = action.payload;
    } else if (action.type === 'action') {
      // Re-trigger with the action as input
      const fakeInput = action.payload === 'help' ? 'What can you help me with?' :
                        action.payload === 'navigate' ? 'Help me navigate' :
                        action.payload || '';
      if (fakeInput) {
        setInput(fakeInput);
        setTimeout(() => handleSend(), 100);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="global-copilot-overlay" onClick={onClose}>
      <div className="global-copilot-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="global-copilot-header">
          <div className="global-copilot-header-left">
            <div className="global-copilot-avatar">
              <span className="global-copilot-avatar-icon">🧠</span>
              <span className="global-copilot-avatar-pulse" />
            </div>
            <div className="global-copilot-header-info">
              <h2 className="global-copilot-title">Copilot</h2>
              <span className="global-copilot-status">
                <span className="global-copilot-status-dot" />
                AI Assistant
              </span>
            </div>
          </div>
          <button className="global-copilot-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Messages */}
        <div className="global-copilot-messages">
          {messages.map(message => (
            <div key={message.id} className={`global-copilot-message ${message.role}`}>
              {message.role === 'assistant' && (
                <div className="global-copilot-message-avatar">🧠</div>
              )}
              <div className="global-copilot-message-content">
                <div className="global-copilot-message-text">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i}>
                      {line.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
                {message.actions && message.actions.length > 0 && (
                  <div className="global-copilot-message-actions">
                    {message.actions.map(action => (
                      <button
                        key={action.id}
                        className="global-copilot-action-btn"
                        onClick={() => handleAction(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="global-copilot-message assistant">
              <div className="global-copilot-message-avatar">🧠</div>
              <div className="global-copilot-message-content">
                <div className="global-copilot-typing">
                  <span className="global-copilot-typing-dot" />
                  <span className="global-copilot-typing-dot" />
                  <span className="global-copilot-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {showQuickPrompts && (
          <div className="global-copilot-quick-prompts">
            <span className="global-copilot-quick-prompts-label">Quick Actions</span>
            <div className="global-copilot-quick-prompts-grid">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt.id}
                  className="global-copilot-quick-prompt"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  <span className="global-copilot-quick-prompt-icon">{prompt.icon}</span>
                  <span className="global-copilot-quick-prompt-label">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="global-copilot-input-area">
          <textarea
            ref={inputRef}
            className="global-copilot-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            rows={1}
          />
          <button
            className="global-copilot-send"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
