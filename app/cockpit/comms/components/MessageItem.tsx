'use client';

import { Message } from '../types';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isSystem = message.authorId === 'system';

  return (
    <div className={`comms-message ${isSystem ? 'system' : ''}`}>
      <div className="comms-message-header">
        <span className="comms-message-author">{message.authorName}</span>
        <span className="comms-message-time">{timeString}</span>
      </div>
      <div className="comms-message-content">{message.content}</div>
    </div>
  );
}