'use client';

import { useState, useMemo } from 'react';
import {
  CalendarView as ViewType,
  CalendarDay,
  ScheduledPost,
  getCalendarDays,
  getWeekDays,
  getMonthName,
  isSameDay,
} from '../../types/schedule';
import { PLATFORMS } from '../../types/feed';

interface CalendarViewProps {
  posts: ScheduledPost[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
  selectedDate?: Date;
}

export default function CalendarView({
  posts,
  onDayClick,
  onPostClick,
  selectedDate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar days with posts
  const calendarDays = useMemo(() => {
    const days = getCalendarDays(year, month);
    return days.map((day) => ({
      ...day,
      posts: posts.filter((post) => {
        const postDate = new Date(post.scheduledFor);
        return isSameDay(postDate, day.date);
      }),
    }));
  }, [year, month, posts]);

  const weekDays = getWeekDays();

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={goToPrevMonth}>
            ←
          </button>
          <h3 className="calendar-title">{getMonthName(currentDate)}</h3>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            →
          </button>
        </div>

        <div className="calendar-actions">
          <button className="calendar-today-btn" onClick={goToToday}>
            TODAY
          </button>
          <div className="calendar-view-toggle">
            {(['month', 'week'] as ViewType[]).map((v) => (
              <button
                key={v}
                className={`calendar-view-btn ${view === v ? 'active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarDays.map((day, idx) => (
          <CalendarDayCell
            key={idx}
            day={day}
            isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
            onClick={() => onDayClick(day.date)}
            onPostClick={onPostClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot scheduled" />
          <span>Scheduled</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot posted" />
          <span>Posted</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot failed" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CALENDAR DAY CELL
// ============================================

interface CalendarDayCellProps {
  day: CalendarDay;
  isSelected: boolean;
  onClick: () => void;
  onPostClick: (post: ScheduledPost) => void;
}

function CalendarDayCell({
  day,
  isSelected,
  onClick,
  onPostClick,
}: CalendarDayCellProps) {
  const dayNumber = day.date.getDate();
  const hasMultiplePosts = day.posts.length > 3;
  const visiblePosts = hasMultiplePosts ? day.posts.slice(0, 2) : day.posts;

  return (
    <div
      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
        day.isToday ? 'today' : ''
      } ${isSelected ? 'selected' : ''} ${day.posts.length > 0 ? 'has-posts' : ''}`}
      onClick={onClick}
    >
      <span className="calendar-day-number">{dayNumber}</span>

      {day.posts.length > 0 && (
        <div className="calendar-day-posts">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className={`calendar-post-chip ${post.status}`}
              onClick={(e) => {
                e.stopPropagation();
                onPostClick(post);
              }}
              title={`${new Date(post.scheduledFor).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${post.caption?.slice(0, 30) || 'No caption'}`}
            >
              <span className="calendar-post-platform">
                {PLATFORMS[post.platform]?.icon || '📱'}
              </span>
              <span className="calendar-post-time">
                {new Date(post.scheduledFor).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
          {hasMultiplePosts && (
            <div className="calendar-post-more">
              +{day.posts.length - 2} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
