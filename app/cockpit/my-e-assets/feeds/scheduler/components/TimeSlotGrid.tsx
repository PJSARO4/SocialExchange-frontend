'use client';

import ScheduledPostCard from './ScheduledPostCard';

interface ScheduledPost {
  id: string;
  accountId: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  status: 'scheduled' | 'automated';
  platform: 'instagram';
}

interface Props {
  dates: Date[];
  posts: ScheduledPost[];
  onSlotClick: (dayIndex: number, hour: number) => void;
  onPostClick: (postId: string) => void;
}

export default function TimeSlotGrid({ dates, posts, onSlotClick, onPostClick }: Props) {
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const getPostsForSlot = (dayIndex: number, hour: number) => {
    return posts.filter(post => post.dayOfWeek === dayIndex && post.hour === hour);
  };

  return (
    <div className="time-slot-grid">
      {hours.map(hour => (
        <div key={hour} className="time-slot-row">
          <div className="time-slot-hour">{formatHour(hour)}</div>
          {dates.map((_, dayIndex) => {
            const slotPosts = getPostsForSlot(dayIndex, hour);
            return (
              <div
                key={dayIndex}
                className="time-slot-cell"
                onClick={() => slotPosts.length === 0 && onSlotClick(dayIndex, hour)}
              >
                {slotPosts.map(post => (
                  <ScheduledPostCard
                    key={post.id}
                    post={post}
                    onClick={() => onPostClick(post.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}