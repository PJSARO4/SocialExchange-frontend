'use client';

import React, { useState } from 'react';
import { Feed } from '../../types/feed';

interface CopilotModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedContent {
  type: 'caption' | 'hashtags' | 'strategy' | 'bio';
  content: string;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ feed, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'generate' | 'ideas'>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<'caption' | 'hashtags' | 'bio' | 'strategy'>('caption');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [topicInput, setTopicInput] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey @${feed.handle}! 👋 I'm your Social Exchange Copilot. I can help you with:\n\n• Writing engaging captions\n• Finding the perfect hashtags\n• Content strategy tips\n• Optimizing your posting schedule\n• Growing your engagement\n\nWhat would you like help with today?`,
      timestamp: new Date()
    }
  ]);

  const contentIdeas = [
    {
      category: 'Trending',
      icon: '🔥',
      ideas: [
        'Behind-the-scenes content',
        'Day in the life',
        'Before & After transformations',
        'Quick tips / How-to'
      ]
    },
    {
      category: 'Engagement',
      icon: '💬',
      ideas: [
        'This or That polls',
        'Ask me anything',
        'Caption this photo',
        'Unpopular opinions'
      ]
    },
    {
      category: 'Personal Brand',
      icon: '✨',
      ideas: [
        'Your story / journey',
        'Lessons learned',
        'Milestone celebrations',
        'Gratitude posts'
      ]
    },
    {
      category: 'Value Content',
      icon: '📚',
      ideas: [
        'Industry tips',
        'Resource recommendations',
        'Common mistakes to avoid',
        'Step-by-step tutorials'
      ]
    }
  ];

  const hashtagSuggestions = {
    lifestyle: ['#lifestyle', '#dailylife', '#livingmybestlife', '#goodvibes', '#positivevibes', '#mindset', '#motivation', '#inspired'],
    photography: ['#photography', '#photooftheday', '#picoftheday', '#instagood', '#beautiful', '#art', '#creative', '#visualsoflife'],
    fitness: ['#fitness', '#workout', '#fitnessmotivation', '#gym', '#health', '#fitlife', '#training', '#exercise'],
    food: ['#foodie', '#foodporn', '#instafood', '#yummy', '#delicious', '#homemade', '#foodphotography', '#foodlover'],
    travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#travelgram', '#vacation', '#travelphotography', '#instatravel']
  };

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          context: {
            handle: feed.handle,
            followers: feed.metrics.followers,
            following: feed.metrics.following,
            totalPosts: feed.metrics.totalPosts,
            engagement: feed.metrics.engagement,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.error || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!topicInput.trim() && generationType !== 'bio' && generationType !== 'strategy') return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch('/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          topic: topicInput,
          context: {
            handle: feed.handle,
            followers: feed.metrics.followers,
            following: feed.metrics.following,
            totalPosts: feed.metrics.totalPosts,
            engagement: feed.metrics.engagement,
            postsPerWeek: feed.metrics.postsPerWeek,
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGeneratedContent({
          type: generationType,
          content: `Error: ${data.error}`,
        });
      } else {
        setGeneratedContent({
          type: generationType,
          content: data.content,
        });
      }
    } catch (error) {
      setGeneratedContent({
        type: generationType,
        content: 'Failed to generate content. Please check your connection and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" onClick={e => e.stopPropagation()}>
        <div className="copilot-header">
          <div className="copilot-title">
            <div className="copilot-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2>AI Copilot</h2>
            <span className="copilot-badge">BETA</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="copilot-tabs">
          <button
            className={`copilot-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </button>
          <button
            className={`copilot-tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Generate
          </button>
          <button
            className={`copilot-tab ${activeTab === 'ideas' ? 'active' : ''}`}
            onClick={() => setActiveTab('ideas')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Ideas
          </button>
        </div>

        <div className="copilot-content">
          {activeTab === 'chat' && (
            <div className="chat-view">
              <div className="messages-container">
                {messages.map(message => (
                  <div key={message.id} className={`message ${message.role}`}>
                    {message.role === 'assistant' && (
                      <div className="message-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                    )}
                    <div className="message-content">
                      <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="message assistant">
                    <div className="message-avatar">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div className="message-content typing">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="chat-input-container">
                <div className="quick-prompts">
                  {['Write me a caption', 'Hashtag suggestions', 'Content ideas', 'Best time to post'].map(prompt => (
                    <button
                      key={prompt}
                      className="quick-prompt"
                      onClick={() => setInputValue(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    className="send-btn"
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
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="generate-view">
              <div className="generate-types">
                {[
                  { type: 'caption', label: 'Caption', icon: '✍️' },
                  { type: 'hashtags', label: 'Hashtags', icon: '#️⃣' },
                  { type: 'bio', label: 'Bio', icon: '👤' },
                  { type: 'strategy', label: 'Strategy', icon: '📊' }
                ].map(item => (
                  <button
                    key={item.type}
                    className={`generate-type ${generationType === item.type ? 'active' : ''}`}
                    onClick={() => {
                      setGenerationType(item.type as typeof generationType);
                      setGeneratedContent(null);
                    }}
                  >
                    <span className="type-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="generate-form">
                {generationType !== 'bio' && generationType !== 'strategy' && (
                  <div className="form-group">
                    <label>
                      {generationType === 'caption' ? 'What is your post about?' : 'Enter topic or niche'}
                    </label>
                    <input
                      type="text"
                      placeholder={generationType === 'caption' ? 'e.g., Beach sunset, New product launch, Monday motivation' : 'e.g., fitness, travel, food'}
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                    />
                  </div>
                )}

                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || (generationType !== 'bio' && generationType !== 'strategy' && !topicInput.trim())}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Generate {generationType.charAt(0).toUpperCase() + generationType.slice(1)}
                    </>
                  )}
                </button>
              </div>

              {generatedContent && (
                <div className="generated-result">
                  <div className="result-header">
                    <h4>Generated {generatedContent.type.charAt(0).toUpperCase() + generatedContent.type.slice(1)}</h4>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(generatedContent.content)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="result-content">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{generatedContent.content}</p>
                  </div>
                  <button
                    className="regenerate-btn"
                    onClick={handleGenerate}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ideas' && (
            <div className="ideas-view">
              <div className="ideas-intro">
                <h3>💡 Content Ideas for @{feed.handle}</h3>
                <p>Stuck on what to post? Here are some trending ideas in your niche!</p>
              </div>

              <div className="ideas-grid">
                {contentIdeas.map(category => (
                  <div key={category.category} className="idea-category">
                    <h4>
                      <span className="category-icon">{category.icon}</span>
                      {category.category}
                    </h4>
                    <ul>
                      {category.ideas.map(idea => (
                        <li key={idea}>
                          <button
                            className="idea-btn"
                            onClick={() => {
                              setActiveTab('generate');
                              setGenerationType('caption');
                              setTopicInput(idea);
                            }}
                          >
                            {idea}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                              <polyline points="12 5 19 12 12 19"/>
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="trending-hashtags">
                <h4>🔥 Trending Hashtags This Week</h4>
                <div className="hashtag-cloud">
                  {['#authenticity', '#growthmindset', '#contentcreator', '#socialmediatips', '#instagramgrowth', '#engagementboost', '#reelstrending', '#viralcontent'].map(tag => (
                    <span key={tag} className="trending-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CopilotModal;
