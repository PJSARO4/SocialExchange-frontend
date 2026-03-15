'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { useComms } from '../context/CommsContext';

const QUICK_EMOJIS = ['👍', '🔥', '❤️', '😂', '🚀', '💎'];

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const { editMessage, deleteMessage, togglePin, toggleReaction, markRead, currentUserId } = useComms();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const editRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isSystem = message.authorId === 'system';
  const isOwn = message.authorId === currentUserId;

  // Mark as read when visible
  useEffect(() => {
    if (!isOwn && !isSystem && message.id) {
      markRead(message.id);
    }
  }, [message.id, isOwn, isSystem, markRead]);

  // Focus edit input
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (editValue.trim() && editValue.trim() !== message.content) {
      editMessage(message.id, editValue.trim());
    }
    setIsEditing(false);
    setShowActions(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEdit();
    if (e.key === 'Escape') { setIsEditing(false); setEditValue(message.content); }
  };

  // Render content with @mention highlighting
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="comms-mention">{part}</span>;
      }
      // Detect URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlParts = part.split(urlRegex);
      return urlParts.map((sub, j) => {
        if (sub.match(urlRegex)) {
          return <a key={`${i}-${j}`} href={sub} target="_blank" rel="noopener noreferrer" className="comms-link">{sub}</a>;
        }
        return sub;
      });
    });
  };

  if (message.isDeleted) {
    return (
      <div className="comms-message deleted">
        <div className="comms-message-header">
          <span className="comms-message-author">{message.authorName}</span>
          <span className="comms-message-time">{timeString}</span>
        </div>
        <div className="comms-message-content deleted-text">This message was deleted</div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      className={`comms-message ${isSystem ? 'system' : ''} ${isOwn ? 'own' : ''} ${message.isPinned ? 'pinned' : ''}`}
      onMouseEnter={() => !isSystem && setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      {/* Pin indicator */}
      {message.isPinned && (
        <div className="comms-pin-indicator">📌 Pinned</div>
      )}

      <div className="comms-message-header">
        <span className="comms-message-author">{message.authorName}</span>
        <div className="comms-message-meta">
          {message.isEdited && <span className="comms-edited-tag">(edited)</span>}
          <span className="comms-message-time">{timeString}</span>
        </div>
      </div>

      {/* Message body */}
      {isEditing ? (
        <div className="comms-edit-wrap">
          <input
            ref={editRef}
            type="text"
            className="comms-edit-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEdit}
          />
          <span className="comms-edit-hint">Enter to save, Esc to cancel</span>
        </div>
      ) : (
        <div className="comms-message-content">{renderContent(message.content)}</div>
      )}

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="comms-reactions">
          {message.reactions.map((r, i) => (
            <button
              key={i}
              className={`comms-reaction-chip ${r.userIds.includes(currentUserId) ? 'active' : ''}`}
              onClick={() => toggleReaction(message.id, r.emoji)}
            >
              <span>{r.emoji}</span>
              <span className="comms-reaction-count">{r.userIds.length}</span>
            </button>
          ))}
        </div>
      )}

      {/* Read receipts */}
      {isOwn && message.readBy && message.readBy.length > 1 && (
        <div className="comms-read-receipts">
          ✓✓ Read by {message.readBy.length - 1}
        </div>
      )}

      {/* Action toolbar */}
      {showActions && !isEditing && (
        <div className="comms-message-actions">
          <button
            className="comms-action-btn"
            title="React"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😀
          </button>
          {isOwn && (
            <button
              className="comms-action-btn"
              title="Edit"
              onClick={() => { setIsEditing(true); setEditValue(message.content); }}
            >
              ✏️
            </button>
          )}
          <button
            className="comms-action-btn"
            title={message.isPinned ? 'Unpin' : 'Pin'}
            onClick={() => togglePin(message.id)}
          >
            📌
          </button>
          {isOwn && (
            <button
              className="comms-action-btn"
              title="Delete"
              onClick={() => deleteMessage(message.id)}
            >
              🗑️
            </button>
          )}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="comms-emoji-picker">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              className="comms-emoji-btn"
              onClick={() => { toggleReaction(message.id, emoji); setShowEmojiPicker(false); }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
