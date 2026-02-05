'use client';

import { useState, useMemo } from 'react';
import type { DragEvent } from 'react';
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
import { WorkflowEvent } from '../../context/WorkflowEventsContext';

// Workflow event icons
const WORKFLOW_EVENT_ICONS: Record<WorkflowEvent['type'], string> = {
  scheduled_run: '⚙️',
  content_scrape: '🔍',
  auto_post: '📤',
  analytics_check: '📊',
  content_added: '➕',
};

// Optimal posting times by day of week (based on typical engagement data)
const OPTIMAL_TIMES: Record<number, string[]> = {
  0: ['10:00', '19:00'], // Sunday
  1: ['11:00', '13:00', '19:00'], // Monday
  2: ['09:00', '13:00', '19:00'], // Tuesday
  3: ['11:00', '13:00', '21:00'], // Wednesday
  4: ['12:00', '14:00', '19:00'], // Thursday
  5: ['09:00', '14:00', '17:00'], // Friday
  6: ['11:00', '19:00'], // Saturday
};

// Check if a day has optimal posting times
function getDayOptimalLevel(date: Date): 'high' | 'medium' | 'low' {
  const day = date.getDay();
  const times = OPTIMAL_TIMES[day];
  if (times.length >= 3) return 'high';
  if (times.length >= 2) return 'medium';
  return 'low';
}

interface CalendarViewProps {
  posts: ScheduledPost[];
  workflowEvents?: WorkflowEvent[];
  onDayClick: (date: Date) => void;
  onPostClick: (post: ScheduledPost) => void;
  onWorkflowEventClick?: (event: WorkflowEvent) => void;
  onDropOnDay?: (date: Date, contentId: string) => void;
  selectedDate?: Date;
  showOptimalTimes?: boolean;
  showWorkflowEvents?: boolean;
}

export default function CalendarView({
  posts,
  workflowEvents = [],
  onDayClick,
  onPostClick,
  onWorkflowEventClick,
  onDropOnDay,
  selectedDate,
  showOptimalTimes = true,
  showWorkflowEvents = true,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate calendar days with posts and workflow events
  const calendarDays = useMemo(() => {
    const days = getCalendarDays(year, month);
    return days.map((day) => ({
      ...day,
      posts: posts.filter((post) => {
        const postDate = new Date(post.scheduledFor);
        return isSameDay(postDate, day.date);
      }),
      workflowEvents: showWorkflowEvents ? workflowEvents.filter((event) => {
        const eventDate = new Date(event.scheduledFor);
        return isSameDay(eventDate, day.date);
      }) : [],
    }));
  }, [year, month, posts, workflowEvents, showWorkflowEvents]);

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
            onWorkflowEventClick={onWorkflowEventClick}
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
        {showWorkflowEvents && (
          <>
            <div className="calendar-legend-separator" />
            <div className="calendar-legend-item">
              <span className="calendar-legend-dot workflow" />
              <span>Workflow</span>
            </div>
          </>
        )}
        {showOptimalTimes && (
          <>
            <div className="calendar-legend-separator" />
            <div className="calendar-legend-item">
              <span className="calendar-legend-dot optimal-high" />
              <span>Best Time</span>
            </div>
            <div className="calendar-legend-item">
              <span className="calendar-legend-dot optimal-medium" />
              <span>Good Time</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALENDAR DAY CELL
// ============================================

interface CalendarDayWithEvents extends CalendarDay {
  workflowEvents: WorkflowEvent[];
}

interface CalendarDayCellProps {
  day: CalendarDayWithEvents;
  isSelected: boolean;
  onClick: () => void;
  onPostClick: (post: ScheduledPost) => void;
  onWorkflowEventClick?: (event: WorkflowEvent) => void;
  onDrop?: (contentId: string) => void;
  showOptimalTimes?: boolean;
}

function CalendarDayCell({
  day,
  isSelected,
  onClick,
  onPostClick,
  onWorkflowEventClick,
  onDrop,
  showOptimalTimes = true,
}: CalendarDayCellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dayNumber = day.date.getDate();

  // Calculate total items (posts + workflow events)
  const totalItems = day.posts.length + day.workflowEvents.length;
  const hasMultipleItems = totalItems > 3;

  // Prioritize showing workflow events first, then posts
  const visibleWorkflowEvents = hasMultipleItems ? day.workflowEvents.slice(0, 1) : day.workflowEvents;
  const remainingSlots = hasMultipleItems ? Math.max(0, 2 - visibleWorkflowEvents.length) : 3 - visibleWorkflowEvents.length;
  const visiblePosts = day.posts.slice(0, remainingSlots);
  const hiddenCount = totalItems - visibleWorkflowEvents.length - visiblePosts.length;

  // Get optimal posting level for this day
  const optimalLevel = showOptimalTimes && day.isCurrentMonth
    ? getDayOptimalLevel(day.date)
    : null;
  const optimalTimes = day.isCurrentMonth ? OPTIMAL_TIMES[day.date.getDay()] : [];

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onDrop) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const contentId = e.dataTransfer.getData('contentId');
    if (contentId && onDrop) {
      onDrop(contentId);
    }
  };

  return (
    <div
      className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
        day.isToday ? 'today' : ''
      } ${isSelected ? 'selected' : ''} ${day.posts.length > 0 ? 'has-posts' : ''} ${
        isDragOver ? 'drag-over' : ''
      } ${optimalLevel ? `optimal-${optimalLevel}` : ''}`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="calendar-day-header">
        <span className="calendar-day-number">{dayNumber}</span>
        {/* Optimal time indicator */}
        {optimalLevel && day.isCurrentMonth && (
          <span
            className={`calendar-optimal-indicator ${optimalLevel}`}
            title={`Best times: ${optimalTimes.join(', ')}`}
          >
            {optimalLevel === 'high' ? '🔥' : optimalLevel === 'medium' ? '✨' : ''}
          </span>
        )}
      </div>

      {(day.posts.length > 0 || day.workflowEvents.length > 0) && (
        <div className="calendar-day-posts">
          {/* Workflow Events */}
          {visibleWorkflowEvents.map((event) => (
            <div
              key={event.id}
              className={`calendar-workflow-chip ${event.status}`}
              onClick={(e) => {
                e.stopPropagation();
                onWorkflowEventClick?.(event);
              }}
              title={`${event.workflowName} - ${new Date(event.scheduledFor).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`}
            >
              <span className="calendar-workflow-icon">
                {WORKFLOW_EVENT_ICONS[event.type] || '⚙️'}
              </span>
              <span className="calendar-workflow-name">
                {event.workflowName.slice(0, 8)}
              </span>
            </div>
          ))}

          {/* Scheduled Posts */}
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className={`calendar-post-chip ${post.status}`}
              onClick={(e) => {
                e.stopPropagation();
                onPostClick(post);
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('postId', post.id);
                e.dataTransfer.setData('contentId', post.contentId);
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

          {hiddenCount > 0 && (
            <div className="calendar-post-more">
              +{hiddenCount} more
            </div>
          )}
        </div>
      )}

      {/* Drag & drop overlay */}
      {isDragOver && (
        <div className="calendar-day-drop-overlay">
          <span>📅 Drop to schedule</span>
        </div>
      )}
    </div>
  );
}
