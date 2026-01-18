'use client';

interface Post {
  id: string;
  hour: number;
  minute: number;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  status: 'scheduled' | 'automated';
}

interface Props {
  post: Post;
  onClick: () => void;
}

export default function ScheduledPostCard({ post, onClick }: Props) {
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return '▪';
      case 'video': return '▶';
      case 'carousel': return '⋮';
      default: return '▪';
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const truncateCaption = (caption: string, maxLength: number = 40) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`scheduled-post-card status-${post.status}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="scheduled-post-header">
        <span className="scheduled-post-time">{formatTime(post.hour, post.minute)}</span>
        <span className="scheduled-post-media">{getMediaIcon(post.mediaType)}</span>
      </div>
      <div className="scheduled-post-caption">{truncateCaption(post.caption)}</div>
      <div className={`scheduled-post-status status-${post.status}`}>
        {post.status === 'automated' ? 'AUTO' : 'MANUAL'}
      </div>
    </div>
  );
}