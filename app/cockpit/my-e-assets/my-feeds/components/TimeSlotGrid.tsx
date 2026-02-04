'use client';

interface ScheduledPost {
  id: string;
  dayOfWeek: number;
  hour: number;
  minute: number;
  caption: string;
}

interface TimeSlotGridProps {
  dates: Date[];
  posts: ScheduledPost[];
  onSlotClick: (dayIndex: number, hour: number) => void;
  onPostClick: (postId: string) => void;
}

export default function TimeSlotGrid({
  dates,
  posts,
  onSlotClick,
  onPostClick,
}: TimeSlotGridProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="time-slot-grid">
      {hours.map(hour => (
        <div key={hour} className="time-slot-row">
          <div className="time-slot-hour">
            {hour}:00
          </div>

          {dates.map((_, dayIndex) => {
            const post = posts.find(
              p => p.dayOfWeek === dayIndex + 1 && p.hour === hour
            );

            return (
              <div
                key={dayIndex}
                className="time-slot-cell"
                onClick={() => onSlotClick(dayIndex, hour)}
              >
                {post && (
                  <div
                    className="scheduled-post"
                    onClick={e => {
                      e.stopPropagation();
                      onPostClick(post.id);
                    }}
                  >
                    {post.caption.slice(0, 30)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
