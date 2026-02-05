'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';

// ============================================
// TYPES
// ============================================

interface CopilotModalProps {
  feed?: Feed;
  feeds?: Feed[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (destination: string) => void;
  onExecuteAction?: (actionId: string, payload?: unknown) => Promise<boolean>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: CopilotAction[];
  isExecuting?: boolean;
}

interface CopilotAction {
  id: string;
  label: string;
  type: 'navigate' | 'execute' | 'confirm' | 'generate';
  payload?: unknown;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface GeneratedContent {
  type: 'caption' | 'hashtags' | 'strategy' | 'bio' | 'post-ideas';
  content: string;
}

interface PendingAction {
  action: CopilotAction;
  messageId: string;
}

interface PerformanceInsight {
  type: 'positive' | 'negative' | 'neutral';
  metric: string;
  message: string;
  suggestion?: string;
}

interface CompetitorData {
  handle: string;
  platform: string;
  followers: number;
  engagement: number;
  postsPerWeek: number;
  topContent: string[];
  strengths: string[];
}

interface WorkflowSuggestion {
  id: string;
  name: string;
  description: string;
  trigger: string;
  benefit: string;
  difficulty: 'easy' | 'medium' | 'advanced';
}

type TabType = 'chat' | 'generate' | 'actions' | 'insights' | 'competitors' | 'workflows';

// ============================================
// KNOWLEDGE BASE
// ============================================

const GENERATION_TYPES = [
  { type: 'caption', label: 'Caption', icon: '✍️', description: 'Engaging post captions' },
  { type: 'hashtags', label: 'Hashtags', icon: '#️⃣', description: 'Strategic hashtag sets' },
  { type: 'bio', label: 'Bio', icon: '👤', description: 'Profile bio options' },
  { type: 'strategy', label: 'Strategy', icon: '📊', description: 'Content strategy' },
  { type: 'post-ideas', label: 'Post Ideas', icon: '💡', description: 'Content ideas for the week' },
];

const ACTION_CATEGORIES = [
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: '📅',
    actions: [
      { id: 'schedule-optimal', label: 'Schedule at Optimal Times', description: 'Auto-schedule posts for best engagement' },
      { id: 'fill-content-gap', label: 'Fill Content Gaps', description: 'Generate posts for empty days' },
      { id: 'reschedule-underperforming', label: 'Reschedule Posts', description: 'Move posts to better times' },
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: '🤖',
    actions: [
      { id: 'enable-autopilot', label: 'Enable Autopilot', description: 'Turn on automated posting' },
      { id: 'create-workflow', label: 'Create Workflow', description: 'Build an automation workflow' },
      { id: 'set-posting-rules', label: 'Set Posting Rules', description: 'Configure auto-posting rules' },
    ]
  },
  {
    id: 'content',
    label: 'Content',
    icon: '📝',
    actions: [
      { id: 'generate-week-content', label: 'Generate Week\'s Content', description: 'Create 7 days of posts' },
      { id: 'repurpose-top-posts', label: 'Repurpose Top Posts', description: 'Create variations of best content' },
      { id: 'curate-from-sources', label: 'Curate Content', description: 'Find content from your sources' },
    ]
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: '💬',
    actions: [
      { id: 'analyze-best-times', label: 'Find Best Times', description: 'Analyze optimal posting times' },
      { id: 'hashtag-research', label: 'Research Hashtags', description: 'Find trending hashtags' },
      { id: 'competitor-analysis', label: 'Analyze Competitors', description: 'Study competitor strategies' },
    ]
  },
];

const QUICK_PROMPTS = [
  { prompt: 'Analyze my account performance', category: 'analytics' },
  { prompt: 'Write me a caption for today\'s post', category: 'content' },
  { prompt: 'What hashtags should I use?', category: 'content' },
  { prompt: 'Help me set up automation', category: 'automation' },
  { prompt: 'Give me content ideas for this week', category: 'content' },
  { prompt: 'What\'s my best time to post?', category: 'analytics' },
  { prompt: 'Compare my accounts\' performance', category: 'analytics' },
  { prompt: 'Create a growth plan for me', category: 'strategy' },
];

// Workflow suggestions based on account state
const WORKFLOW_SUGGESTIONS: WorkflowSuggestion[] = [
  {
    id: 'auto-post',
    name: 'Auto Post from Library',
    description: 'Automatically post your approved content at optimal times',
    trigger: 'Daily at optimal times',
    benefit: 'Consistent posting without manual effort',
    difficulty: 'easy',
  },
  {
    id: 'content-scraper',
    name: 'Competitor Content Monitor',
    description: 'Track competitor posts and save high-performing content for inspiration',
    trigger: 'Every 6 hours',
    benefit: 'Stay ahead of trends and competition',
    difficulty: 'medium',
  },
  {
    id: 'ai-caption',
    name: 'AI Caption Enhancement',
    description: 'Automatically generate and improve captions for uploaded content',
    trigger: 'When new content added',
    benefit: 'Save time writing captions',
    difficulty: 'easy',
  },
  {
    id: 'hashtag-optimizer',
    name: 'Smart Hashtag Research',
    description: 'Automatically research and apply trending hashtags to your posts',
    trigger: 'Before each post',
    benefit: 'Maximize reach with optimal hashtags',
    difficulty: 'easy',
  },
  {
    id: 'engagement-responder',
    name: 'Engagement Auto-Responder',
    description: 'Auto-like and reply to comments on your posts',
    trigger: 'When new comments arrive',
    benefit: 'Boost engagement and build community',
    difficulty: 'advanced',
  },
  {
    id: 'analytics-report',
    name: 'Weekly Analytics Report',
    description: 'Generate a weekly report of your account performance',
    trigger: 'Every Sunday at 9 AM',
    benefit: 'Track progress without manual analysis',
    difficulty: 'medium',
  },
];

// Mock competitor data generator
function generateMockCompetitors(feed?: Feed): CompetitorData[] {
  if (!feed) return [];

  const baseFollowers = feed.metrics.followers || 1000;

  return [
    {
      handle: '@similar_creator_1',
      platform: feed.platform,
      followers: Math.floor(baseFollowers * 1.5),
      engagement: 4.2,
      postsPerWeek: 7,
      topContent: ['Carousel tutorials', 'Behind-the-scenes', 'Product reviews'],
      strengths: ['Consistent posting', 'Strong hooks', 'Community engagement'],
    },
    {
      handle: '@niche_leader',
      platform: feed.platform,
      followers: Math.floor(baseFollowers * 3),
      engagement: 5.8,
      postsPerWeek: 5,
      topContent: ['Educational reels', 'User stories', 'Trend participation'],
      strengths: ['High-quality visuals', 'Storytelling', 'Collaborations'],
    },
    {
      handle: '@rising_star',
      platform: feed.platform,
      followers: Math.floor(baseFollowers * 0.7),
      engagement: 8.1,
      postsPerWeek: 10,
      topContent: ['Personal stories', 'Quick tips', 'Relatable content'],
      strengths: ['Authenticity', 'Trending audio', 'Engagement bait'],
    },
  ];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateInsights(feeds: Feed[]): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  if (feeds.length === 0) return insights;

  // Aggregate metrics
  const totalFollowers = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);
  const avgEngagement = feeds.reduce((sum, f) => sum + (f.metrics.engagement || 0), 0) / feeds.length;
  const totalPosts = feeds.reduce((sum, f) => sum + (f.metrics.totalPosts || 0), 0);
  const avgPostsPerWeek = feeds.reduce((sum, f) => sum + (f.metrics.postsPerWeek || 0), 0) / feeds.length;

  // Engagement insights
  if (avgEngagement < 2) {
    insights.push({
      type: 'negative',
      metric: 'Engagement Rate',
      message: `Your average engagement rate is ${avgEngagement.toFixed(2)}%, which is below the industry average.`,
      suggestion: 'Try posting more carousel posts and ask questions in your captions to boost engagement.'
    });
  } else if (avgEngagement > 5) {
    insights.push({
      type: 'positive',
      metric: 'Engagement Rate',
      message: `Excellent! Your ${avgEngagement.toFixed(2)}% engagement rate is well above average.`,
      suggestion: 'Keep up the great work! Consider documenting what\'s working to replicate success.'
    });
  }

  // Posting frequency
  if (avgPostsPerWeek < 3) {
    insights.push({
      type: 'negative',
      metric: 'Posting Frequency',
      message: `You're posting ${avgPostsPerWeek.toFixed(1)} times per week on average.`,
      suggestion: 'Increase to at least 4-5 posts per week for better algorithm visibility.'
    });
  } else if (avgPostsPerWeek >= 7) {
    insights.push({
      type: 'positive',
      metric: 'Posting Frequency',
      message: `Great consistency! ${avgPostsPerWeek.toFixed(1)} posts per week shows commitment.`,
    });
  }

  // Multi-account insights
  if (feeds.length > 1) {
    const bestPerformer = feeds.reduce((best, f) =>
      (f.metrics.engagement || 0) > (best.metrics.engagement || 0) ? f : best
    );
    const worstPerformer = feeds.reduce((worst, f) =>
      (f.metrics.engagement || 0) < (worst.metrics.engagement || 0) ? f : worst
    );

    if (bestPerformer.id !== worstPerformer.id) {
      insights.push({
        type: 'neutral',
        metric: 'Account Comparison',
        message: `@${bestPerformer.handle} outperforms @${worstPerformer.handle} by ${((bestPerformer.metrics.engagement || 0) - (worstPerformer.metrics.engagement || 0)).toFixed(2)}% engagement.`,
        suggestion: `Apply strategies from @${bestPerformer.handle} to @${worstPerformer.handle}.`
      });
    }
  }

  // Growth insights
  feeds.forEach(feed => {
    if (feed.metrics.recentGrowth !== undefined) {
      if (feed.metrics.recentGrowth > 5) {
        insights.push({
          type: 'positive',
          metric: 'Growth',
          message: `@${feed.handle} is growing at ${feed.metrics.recentGrowth}% - keep it up!`,
        });
      } else if (feed.metrics.recentGrowth < -2) {
        insights.push({
          type: 'negative',
          metric: 'Growth',
          message: `@${feed.handle} has declined ${Math.abs(feed.metrics.recentGrowth)}% recently.`,
          suggestion: 'Review recent content and engagement patterns.'
        });
      }
    }
  });

  return insights;
}

function getContextSummary(feeds: Feed[]): string {
  if (feeds.length === 0) return 'No accounts connected.';

  const totalFollowers = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);
  const avgEngagement = feeds.reduce((sum, f) => sum + (f.metrics.engagement || 0), 0) / feeds.length;
  const platforms = [...new Set(feeds.map(f => f.platform))];

  return `${feeds.length} account${feeds.length > 1 ? 's' : ''} connected across ${platforms.map(p => PLATFORMS[p].label).join(', ')}. Total: ${totalFollowers.toLocaleString()} followers, ${avgEngagement.toFixed(2)}% avg engagement.`;
}

// ============================================
// COMPONENT
// ============================================

export const CopilotModal: React.FC<CopilotModalProps> = ({
  feed,
  feeds = [],
  isOpen,
  onClose,
  onNavigate,
  onExecuteAction
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<string>('caption');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use all feeds if provided, otherwise use single feed
  const allFeeds = feeds.length > 0 ? feeds : (feed ? [feed] : []);
  const primaryFeed = feed || (allFeeds[0] as Feed | undefined);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey! 👋 I'm your Social Exchange Copilot. I have access to ${allFeeds.length > 0 ? `your ${allFeeds.length} connected account${allFeeds.length > 1 ? 's' : ''}` : 'your accounts'} and can help you with:

• **Content**: Write captions, find hashtags, generate ideas
• **Strategy**: Analyze performance, plan growth
• **Automation**: Set up autopilot, create workflows
• **Analytics**: Compare accounts, track metrics

What would you like to work on today?`,
      timestamp: new Date(),
      actions: [
        { id: 'analyze', label: 'Analyze Performance', type: 'navigate', payload: 'insights' },
        { id: 'generate', label: 'Generate Content', type: 'navigate', payload: 'generate' },
      ]
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened or tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const context = primaryFeed ? {
        handle: primaryFeed.handle,
        followers: primaryFeed.metrics.followers,
        following: primaryFeed.metrics.following,
        totalPosts: primaryFeed.metrics.totalPosts,
        engagement: primaryFeed.metrics.engagement,
        allAccounts: allFeeds.map(f => ({
          handle: f.handle,
          platform: f.platform,
          followers: f.metrics.followers,
          engagement: f.metrics.engagement,
        }))
      } : { allAccounts: [] };

      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          context,
        }),
      });

      const data = await response.json();

      // Parse response for potential actions
      const actions: CopilotAction[] = [];
      const content = data.reply || data.error || 'Sorry, I encountered an error. Please try again.';

      // Detect if response suggests actions
      if (content.toLowerCase().includes('schedule') || content.toLowerCase().includes('posting')) {
        actions.push({ id: 'go-scheduler', label: 'Open Scheduler', type: 'navigate', payload: 'scheduler' });
      }
      if (content.toLowerCase().includes('hashtag')) {
        actions.push({ id: 'gen-hashtags', label: 'Generate Hashtags', type: 'generate', payload: 'hashtags' });
      }
      if (content.toLowerCase().includes('caption') || content.toLowerCase().includes('write')) {
        actions.push({ id: 'gen-caption', label: 'Write Caption', type: 'generate', payload: 'caption' });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback to local response if API fails
      const localResponse = generateLocalResponse(inputValue, allFeeds);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResponse.content,
        timestamp: new Date(),
        actions: localResponse.actions
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!topicInput.trim() && generationType !== 'bio' && generationType !== 'strategy' && generationType !== 'post-ideas') return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const context = primaryFeed ? {
        handle: primaryFeed.handle,
        followers: primaryFeed.metrics.followers,
        following: primaryFeed.metrics.following,
        totalPosts: primaryFeed.metrics.totalPosts,
        engagement: primaryFeed.metrics.engagement,
        postsPerWeek: primaryFeed.metrics.postsPerWeek,
      } : {};

      const response = await fetch('/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType === 'post-ideas' ? 'strategy' : generationType,
          topic: generationType === 'post-ideas' ? 'content ideas for the week' : topicInput,
          context,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGeneratedContent({
          type: generationType as GeneratedContent['type'],
          content: `Error: ${data.error}`,
        });
      } else {
        setGeneratedContent({
          type: generationType as GeneratedContent['type'],
          content: data.content,
        });
      }
    } catch (error) {
      // Fallback content
      setGeneratedContent({
        type: generationType as GeneratedContent['type'],
        content: generateFallbackContent(generationType, topicInput, primaryFeed),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActionClick = async (action: CopilotAction, messageId?: string) => {
    if (action.type === 'navigate') {
      if (action.payload === 'insights') {
        setActiveTab('insights');
      } else if (action.payload === 'generate') {
        setActiveTab('generate');
      } else if (onNavigate) {
        onNavigate(action.payload as string);
      }
    } else if (action.type === 'generate') {
      setActiveTab('generate');
      setGenerationType(action.payload as string);
    } else if (action.type === 'execute') {
      if (action.requiresConfirmation) {
        setPendingAction({ action, messageId: messageId || '' });
      } else {
        await executeAction(action);
      }
    } else if (action.type === 'confirm') {
      await executeAction(action);
    }
  };

  const executeAction = async (action: CopilotAction) => {
    if (onExecuteAction) {
      const success = await onExecuteAction(action.id, action.payload);

      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: success
          ? `✅ Action "${action.label}" completed successfully.`
          : `❌ Action "${action.label}" could not be completed.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, resultMessage]);
    }
    setPendingAction(null);
  };

  const handleQuickAction = (actionId: string) => {
    const allActions = ACTION_CATEGORIES.flatMap(cat => cat.actions);
    const action = allActions.find(a => a.id === actionId);

    if (action) {
      const confirmAction: CopilotAction = {
        id: action.id,
        label: action.label,
        type: 'execute',
        requiresConfirmation: true,
        confirmationMessage: `Are you sure you want to ${action.label.toLowerCase()}? This will affect your connected accounts.`
      };

      setPendingAction({ action: confirmAction, messageId: 'quick-action' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const insights = generateInsights(allFeeds);

  return (
    <div className="copilot-modal-overlay" onClick={onClose}>
      <div className="copilot-modal-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="copilot-modal-header">
          <div className="copilot-header-left">
            <div className="copilot-avatar">
              <span className="copilot-avatar-icon">🧠</span>
              <span className="copilot-avatar-pulse" />
            </div>
            <div className="copilot-header-info">
              <h2>AI Copilot</h2>
              <span className="copilot-status">
                <span className="copilot-status-dot" />
                {getContextSummary(allFeeds)}
              </span>
            </div>
          </div>
          <button className="copilot-close-btn" onClick={onClose}>×</button>
        </header>

        {/* Tabs */}
        <nav className="copilot-tabs">
          {(['chat', 'generate', 'actions', 'insights', 'competitors', 'workflows'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`copilot-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'chat' && '💬'}
              {tab === 'generate' && '⚡'}
              {tab === 'actions' && '🎯'}
              {tab === 'insights' && '📊'}
              {tab === 'competitors' && '👁️'}
              {tab === 'workflows' && '⚙️'}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="copilot-content">
          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="copilot-chat-view">
              <div className="copilot-messages">
                {messages.map(message => (
                  <div key={message.id} className={`copilot-message ${message.role}`}>
                    {message.role === 'assistant' && (
                      <div className="copilot-message-avatar">🧠</div>
                    )}
                    <div className="copilot-message-content">
                      <div className="copilot-message-text">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i}>
                            {line.split('**').map((part, j) =>
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        ))}
                      </div>
                      {message.actions && message.actions.length > 0 && (
                        <div className="copilot-message-actions">
                          {message.actions.map(action => (
                            <button
                              key={action.id}
                              className={`copilot-action-btn ${action.type}`}
                              onClick={() => handleActionClick(action, message.id)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="copilot-message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="copilot-message assistant">
                    <div className="copilot-message-avatar">🧠</div>
                    <div className="copilot-message-content">
                      <div className="copilot-typing">
                        <span className="copilot-typing-dot" />
                        <span className="copilot-typing-dot" />
                        <span className="copilot-typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="copilot-quick-prompts">
                {QUICK_PROMPTS.slice(0, 4).map((item, i) => (
                  <button
                    key={i}
                    className="copilot-quick-prompt-btn"
                    onClick={() => {
                      setInputValue(item.prompt);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                  >
                    {item.prompt}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="copilot-input-area">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything about your social media..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isGenerating}
                />
                <button
                  className="copilot-send-btn"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isGenerating}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* GENERATE TAB */}
          {activeTab === 'generate' && (
            <div className="copilot-generate-view">
              <div className="generate-types-grid">
                {GENERATION_TYPES.map(item => (
                  <button
                    key={item.type}
                    className={`generate-type-btn ${generationType === item.type ? 'active' : ''}`}
                    onClick={() => {
                      setGenerationType(item.type);
                      setGeneratedContent(null);
                    }}
                  >
                    <span className="generate-type-icon">{item.icon}</span>
                    <span className="generate-type-label">{item.label}</span>
                    <span className="generate-type-desc">{item.description}</span>
                  </button>
                ))}
              </div>

              <div className="generate-form">
                {generationType !== 'bio' && generationType !== 'strategy' && generationType !== 'post-ideas' && (
                  <div className="generate-input-group">
                    <label>
                      {generationType === 'caption' ? 'What is your post about?' : 'Enter topic or niche'}
                    </label>
                    <input
                      type="text"
                      placeholder={generationType === 'caption' ? 'e.g., Beach sunset, New product launch' : 'e.g., fitness, travel, food'}
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                    />
                  </div>
                )}

                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || (generationType !== 'bio' && generationType !== 'strategy' && generationType !== 'post-ideas' && !topicInput.trim())}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Generate {GENERATION_TYPES.find(t => t.type === generationType)?.label}
                    </>
                  )}
                </button>
              </div>

              {generatedContent && (
                <div className="generated-result">
                  <div className="generated-result-header">
                    <h4>Generated {GENERATION_TYPES.find(t => t.type === generatedContent.type)?.label}</h4>
                    <button className="copy-btn" onClick={() => copyToClipboard(generatedContent.content)}>
                      📋 Copy
                    </button>
                  </div>
                  <div className="generated-result-content">
                    <pre>{generatedContent.content}</pre>
                  </div>
                  <div className="generated-result-actions">
                    <button className="regenerate-btn" onClick={handleGenerate}>
                      🔄 Regenerate
                    </button>
                    <button className="use-btn" onClick={() => {
                      // Add to message as confirmation
                      const msg: Message = {
                        id: Date.now().toString(),
                        role: 'system',
                        content: `✅ Generated ${generatedContent.type} copied and ready to use!`,
                        timestamp: new Date()
                      };
                      setMessages(prev => [...prev, msg]);
                      setActiveTab('chat');
                    }}>
                      ✓ Use This
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS TAB */}
          {activeTab === 'actions' && (
            <div className="copilot-actions-view">
              <div className="actions-intro">
                <h3>🎯 Quick Actions</h3>
                <p>Execute actions across your connected accounts with AI assistance.</p>
              </div>

              {ACTION_CATEGORIES.map(category => (
                <div key={category.id} className="action-category">
                  <h4>
                    <span className="category-icon">{category.icon}</span>
                    {category.label}
                  </h4>
                  <div className="action-list">
                    {category.actions.map(action => (
                      <button
                        key={action.id}
                        className="action-item"
                        onClick={() => handleQuickAction(action.id)}
                      >
                        <div className="action-item-info">
                          <span className="action-item-label">{action.label}</span>
                          <span className="action-item-desc">{action.description}</span>
                        </div>
                        <span className="action-item-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Affected accounts indicator */}
              {allFeeds.length > 0 && (
                <div className="actions-affected">
                  <span className="affected-label">Actions will affect:</span>
                  <div className="affected-accounts">
                    {allFeeds.map(f => (
                      <span key={f.id} className="affected-account">
                        {PLATFORMS[f.platform].icon} @{f.handle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="copilot-insights-view">
              <div className="insights-header">
                <h3>📊 Performance Insights</h3>
                <p>AI-generated analysis of your accounts</p>
              </div>

              {insights.length > 0 ? (
                <div className="insights-list">
                  {insights.map((insight, i) => (
                    <div key={i} className={`insight-card ${insight.type}`}>
                      <div className="insight-icon">
                        {insight.type === 'positive' && '✅'}
                        {insight.type === 'negative' && '⚠️'}
                        {insight.type === 'neutral' && 'ℹ️'}
                      </div>
                      <div className="insight-content">
                        <span className="insight-metric">{insight.metric}</span>
                        <p className="insight-message">{insight.message}</p>
                        {insight.suggestion && (
                          <p className="insight-suggestion">💡 {insight.suggestion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="insights-empty">
                  <span className="insights-empty-icon">📈</span>
                  <p>Connect accounts to see personalized insights</p>
                </div>
              )}

              {/* Account Summary */}
              {allFeeds.length > 0 && (
                <div className="insights-summary">
                  <h4>Account Summary</h4>
                  <div className="summary-grid">
                    {allFeeds.map(feed => (
                      <div key={feed.id} className="summary-card">
                        <div className="summary-card-header">
                          <span className="summary-platform">{PLATFORMS[feed.platform].icon}</span>
                          <span className="summary-handle">@{feed.handle}</span>
                        </div>
                        <div className="summary-stats">
                          <div className="summary-stat">
                            <span className="stat-value">{(feed.metrics.followers || 0).toLocaleString()}</span>
                            <span className="stat-label">Followers</span>
                          </div>
                          <div className="summary-stat">
                            <span className="stat-value">{(feed.metrics.engagement || 0).toFixed(2)}%</span>
                            <span className="stat-label">Engagement</span>
                          </div>
                          <div className="summary-stat">
                            <span className="stat-value">{feed.metrics.postsPerWeek || 0}/wk</span>
                            <span className="stat-label">Posts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPETITORS TAB */}
          {activeTab === 'competitors' && (
            <div className="copilot-competitors-view">
              <div className="competitors-header">
                <h3>👁️ Competitive Analysis</h3>
                <p>AI-powered insights on similar accounts in your niche</p>
              </div>

              {primaryFeed ? (
                <>
                  {/* Your Position */}
                  <div className="your-position">
                    <h4>Your Position</h4>
                    <div className="position-card">
                      <div className="position-account">
                        <span className="position-platform">{PLATFORMS[primaryFeed.platform].icon}</span>
                        <span className="position-handle">@{primaryFeed.handle}</span>
                      </div>
                      <div className="position-stats">
                        <div className="position-stat">
                          <span className="stat-value">{(primaryFeed.metrics.followers || 0).toLocaleString()}</span>
                          <span className="stat-label">Followers</span>
                        </div>
                        <div className="position-stat">
                          <span className="stat-value">{(primaryFeed.metrics.engagement || 0).toFixed(1)}%</span>
                          <span className="stat-label">Engagement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Competitor Cards */}
                  <div className="competitors-list">
                    <h4>Similar Accounts to Watch</h4>
                    {generateMockCompetitors(primaryFeed).map((comp, i) => (
                      <div key={i} className="competitor-card">
                        <div className="competitor-header">
                          <div className="competitor-identity">
                            <span className="competitor-handle">{comp.handle}</span>
                            <span className="competitor-platform">{PLATFORMS[comp.platform as keyof typeof PLATFORMS]?.icon}</span>
                          </div>
                          <div className="competitor-comparison">
                            {comp.followers > (primaryFeed.metrics.followers || 0) ? (
                              <span className="comp-badge larger">+{((comp.followers / (primaryFeed.metrics.followers || 1) - 1) * 100).toFixed(0)}% larger</span>
                            ) : (
                              <span className="comp-badge smaller">{((1 - comp.followers / (primaryFeed.metrics.followers || 1)) * 100).toFixed(0)}% smaller</span>
                            )}
                          </div>
                        </div>

                        <div className="competitor-stats">
                          <div className="comp-stat">
                            <span className="comp-stat-value">{comp.followers.toLocaleString()}</span>
                            <span className="comp-stat-label">Followers</span>
                          </div>
                          <div className="comp-stat">
                            <span className="comp-stat-value">{comp.engagement}%</span>
                            <span className="comp-stat-label">Engagement</span>
                          </div>
                          <div className="comp-stat">
                            <span className="comp-stat-value">{comp.postsPerWeek}/wk</span>
                            <span className="comp-stat-label">Posts</span>
                          </div>
                        </div>

                        <div className="competitor-insights">
                          <div className="insight-section">
                            <span className="insight-title">Top Content Types</span>
                            <div className="insight-tags">
                              {comp.topContent.map((content, j) => (
                                <span key={j} className="insight-tag">{content}</span>
                              ))}
                            </div>
                          </div>
                          <div className="insight-section">
                            <span className="insight-title">Key Strengths</span>
                            <div className="insight-tags strengths">
                              {comp.strengths.map((strength, j) => (
                                <span key={j} className="insight-tag">{strength}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button className="track-competitor-btn">
                          + Track This Account
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Competitive Tips */}
                  <div className="competitive-tips">
                    <h4>💡 AI Recommendations</h4>
                    <ul className="tips-list">
                      <li>Post more carousel content - competitors see 2x engagement with this format</li>
                      <li>Increase posting frequency by 2 posts/week to match niche average</li>
                      <li>Try trending audio in Reels - top performers use it in 60% of content</li>
                      <li>Engage more with comments - respond within 1 hour for best algorithm boost</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="competitors-empty">
                  <span className="empty-icon">👁️</span>
                  <p>Select an account to see competitive analysis</p>
                </div>
              )}
            </div>
          )}

          {/* WORKFLOWS TAB */}
          {activeTab === 'workflows' && (
            <div className="copilot-workflows-view">
              <div className="workflows-header">
                <h3>⚙️ Suggested Workflows</h3>
                <p>AI-recommended automations based on your account activity</p>
              </div>

              {/* Workflow Suggestions */}
              <div className="workflow-suggestions">
                {WORKFLOW_SUGGESTIONS.map(workflow => (
                  <div key={workflow.id} className={`workflow-suggestion-card ${workflow.difficulty}`}>
                    <div className="workflow-card-header">
                      <h4>{workflow.name}</h4>
                      <span className={`difficulty-badge ${workflow.difficulty}`}>
                        {workflow.difficulty}
                      </span>
                    </div>
                    <p className="workflow-description">{workflow.description}</p>

                    <div className="workflow-details">
                      <div className="workflow-detail">
                        <span className="detail-icon">⏰</span>
                        <span className="detail-text">{workflow.trigger}</span>
                      </div>
                      <div className="workflow-detail">
                        <span className="detail-icon">✨</span>
                        <span className="detail-text">{workflow.benefit}</span>
                      </div>
                    </div>

                    <div className="workflow-actions">
                      <button className="workflow-preview-btn">Preview</button>
                      <button className="workflow-create-btn">Create Workflow</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Setup */}
              <div className="quick-setup">
                <h4>⚡ Quick Setup</h4>
                <p>Get started with one click - we'll configure everything for you</p>
                <div className="quick-setup-options">
                  <button className="quick-setup-btn">
                    <span className="setup-icon">🚀</span>
                    <span className="setup-text">Auto-Post Daily</span>
                    <span className="setup-desc">Post from library at optimal times</span>
                  </button>
                  <button className="quick-setup-btn">
                    <span className="setup-icon">🧠</span>
                    <span className="setup-text">AI Content Helper</span>
                    <span className="setup-desc">Auto-generate captions & hashtags</span>
                  </button>
                  <button className="quick-setup-btn">
                    <span className="setup-icon">📊</span>
                    <span className="setup-text">Weekly Reports</span>
                    <span className="setup-desc">Get analytics delivered weekly</span>
                  </button>
                </div>
              </div>

              {/* Account-Specific Recommendations */}
              {primaryFeed && (
                <div className="account-recommendations">
                  <h4>📌 Recommended for @{primaryFeed.handle}</h4>
                  <div className="recommendation-cards">
                    {(primaryFeed.metrics.postsPerWeek || 0) < 4 && (
                      <div className="recommendation-card">
                        <span className="rec-icon">📅</span>
                        <div className="rec-content">
                          <span className="rec-title">Increase Posting Frequency</span>
                          <span className="rec-text">You're posting {primaryFeed.metrics.postsPerWeek || 0} times/week. Set up auto-posting to reach 5+/week.</span>
                        </div>
                        <button className="rec-action">Set Up</button>
                      </div>
                    )}
                    {(primaryFeed.metrics.engagement || 0) < 3 && (
                      <div className="recommendation-card">
                        <span className="rec-icon">💬</span>
                        <div className="rec-content">
                          <span className="rec-title">Boost Engagement</span>
                          <span className="rec-text">Your {(primaryFeed.metrics.engagement || 0).toFixed(1)}% engagement can improve with AI-optimized captions.</span>
                        </div>
                        <button className="rec-action">Enable</button>
                      </div>
                    )}
                    <div className="recommendation-card">
                      <span className="rec-icon">⏰</span>
                      <div className="rec-content">
                        <span className="rec-title">Optimal Timing</span>
                        <span className="rec-text">Let AI find and use your best posting times automatically.</span>
                      </div>
                      <button className="rec-action">Activate</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {pendingAction && (
          <div className="copilot-confirm-overlay">
            <div className="copilot-confirm-dialog">
              <div className="confirm-icon">⚡</div>
              <h4>Confirm Action</h4>
              <p>{pendingAction.action.confirmationMessage || `Execute "${pendingAction.action.label}"?`}</p>
              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={() => setPendingAction(null)}>
                  Cancel
                </button>
                <button className="confirm-proceed" onClick={() => executeAction(pendingAction.action)}>
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="copilot-modal-footer">
          <span>Powered by Social Exchange AI</span>
        </footer>
      </div>
    </div>
  );
};

// ============================================
// FALLBACK RESPONSE GENERATORS
// ============================================

function generateLocalResponse(input: string, feeds: Feed[]): { content: string; actions?: CopilotAction[] } {
  const lowerInput = input.toLowerCase();

  const totalFollowers = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);
  const avgEngagement = feeds.reduce((sum, f) => sum + (f.metrics.engagement || 0), 0) / (feeds.length || 1);

  if (lowerInput.includes('performance') || lowerInput.includes('analyz')) {
    return {
      content: `Based on your ${feeds.length} connected account${feeds.length !== 1 ? 's' : ''}:\n\n**Overview:**\n• Total Followers: ${totalFollowers.toLocaleString()}\n• Average Engagement: ${avgEngagement.toFixed(2)}%\n• Accounts: ${feeds.map(f => `@${f.handle}`).join(', ')}\n\n${avgEngagement < 3 ? '**Tip:** Your engagement could use a boost. Try posting more engaging content like polls, questions, and carousels.' : '**Great work!** Your engagement is solid. Keep up the consistency!'}`,
      actions: [
        { id: 'view-insights', label: 'View Full Insights', type: 'navigate', payload: 'insights' }
      ]
    };
  }

  if (lowerInput.includes('caption')) {
    return {
      content: `I can help you write a caption! Here's a quick formula:\n\n**Hook** → Grab attention in the first line\n**Story** → Share value or a personal touch\n**CTA** → End with a call-to-action\n\nWould you like me to generate one for you?`,
      actions: [
        { id: 'gen-caption', label: 'Generate Caption', type: 'generate', payload: 'caption' }
      ]
    };
  }

  if (lowerInput.includes('hashtag')) {
    return {
      content: `**Hashtag Strategy Tips:**\n\n1. Use 15-25 hashtags per post\n2. Mix sizes: small (10K-100K), medium (100K-1M), large (1M+)\n3. Include niche-specific tags\n4. Rotate your hashtag sets\n\nWant me to research hashtags for your niche?`,
      actions: [
        { id: 'gen-hashtags', label: 'Generate Hashtags', type: 'generate', payload: 'hashtags' }
      ]
    };
  }

  if (lowerInput.includes('automat') || lowerInput.includes('autopilot')) {
    return {
      content: `**Automation Options:**\n\n🤖 **Autopilot Mode** - Full automation\n🔒 **Escrow Mode** - Review before posting\n✋ **Manual Mode** - Complete control\n\nI can help you set up automation workflows that post content at optimal times while you focus on strategy.`,
      actions: [
        { id: 'go-actions', label: 'Set Up Automation', type: 'navigate', payload: 'actions' }
      ]
    };
  }

  return {
    content: `I'm here to help! I can assist with:\n\n• **Content** - Captions, hashtags, post ideas\n• **Strategy** - Growth plans, best times to post\n• **Analytics** - Performance analysis, comparisons\n• **Automation** - Set up autopilot, workflows\n\nWhat would you like to explore?`,
    actions: [
      { id: 'gen', label: 'Generate Content', type: 'navigate', payload: 'generate' },
      { id: 'actions', label: 'Quick Actions', type: 'navigate', payload: 'actions' }
    ]
  };
}

function generateFallbackContent(type: string, topic: string, feed?: Feed): string {
  const handle = feed?.handle || 'your_account';

  switch (type) {
    case 'caption':
      return `✨ ${topic || 'New post'} loading...\n\nSometimes the best moments are the ones we least expect. This is one of them.\n\nDouble tap if you agree 👇\n\n#${topic?.replace(/\s+/g, '') || 'lifestyle'} #contentcreator #authentic #goodvibes`;

    case 'hashtags':
      return `**Hashtags for: ${topic || 'lifestyle'}**\n\n**High Volume:**\n#${topic?.replace(/\s+/g, '') || 'lifestyle'} #instagood #photooftheday #love #beautiful\n\n**Medium Volume:**\n#${topic?.replace(/\s+/g, '') || 'life'}style #dailyinspiration #contentcreator #creativecontent\n\n**Niche:**\n#${topic?.replace(/\s+/g, '') || 'authentic'}moments #reallife #${topic?.replace(/\s+/g, '') || 'genuine'}`;

    case 'bio':
      return `**Option 1 - Professional:**\n${topic || 'Creator'} | Sharing stories & inspiration\n📍 Making magic happen\n🔗 Link below 👇\n\n**Option 2 - Personal:**\n${topic || 'Just'} living my best life ✨\nSharing the journey with you\nDM for collabs 💌\n\n**Option 3 - Minimal:**\n${topic || 'Creator'} 📸\n@${handle}`;

    case 'strategy':
    case 'post-ideas':
      return `**Content Strategy for @${handle}**\n\n**Content Pillars:**\n1. Educational content (40%)\n2. Entertainment/Trending (30%)\n3. Personal/Behind-the-scenes (20%)\n4. Promotional (10%)\n\n**Posting Schedule:**\n• Best days: Tuesday, Thursday, Saturday\n• Best times: 9 AM, 12 PM, 7 PM\n• Frequency: 4-5 posts per week\n\n**This Week's Ideas:**\n1. Monday: Motivational quote carousel\n2. Wednesday: How-to/Tutorial\n3. Friday: Behind-the-scenes\n4. Weekend: Trending audio Reel`;

    default:
      return 'Content generated successfully!';
  }
}

export default CopilotModal;
