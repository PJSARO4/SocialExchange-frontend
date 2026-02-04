'use client';

import { useState, useMemo } from 'react';
import { ContentItem } from '../../types/content';
import { Feed, PLATFORMS } from '../../types/feed';
import { CreateSchedulePayload, generateTimeSlots } from '../../types/schedule';

interface SchedulePostModalProps {
  content?: ContentItem;
  feeds: Feed[];
  selectedFeedId?: string;
  initialDate?: Date;
  onSchedule: (payload: CreateSchedulePayload) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export default function SchedulePostModal({
  content,
  feeds,
  selectedFeedId,
  initialDate,
  onSchedule,
  onClose,
  isLoading = false,
}: SchedulePostModalProps) {
  const [feedId, setFeedId] = useState(selectedFeedId || feeds[0]?.id || '');
  const [date, setDate] = useState(() => {
    const d = initialDate || new Date();
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('12:00');
  const [caption, setCaption] = useState(content?.caption || '');
  const [hashtags, setHashtags] = useState(content?.hashtags?.join(', ') || '');
  const [error, setError] = useState<string | null>(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const selectedFeed = feeds.find((f) => f.id === feedId);
  const platform = selectedFeed ? PLATFORMS[selectedFeed.platform] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedId) {
      setError('Please select an account');
      return;
    }

    if (!content) {
      setError('No content selected');
      return;
    }

    const scheduledFor = new Date(`${date}T${time}`);
    if (scheduledFor <= new Date()) {
      setError('Scheduled time must be in the future');
      return;
    }

    try {
      await onSchedule({
        contentId: content.id,
        feedId,
        scheduledFor: scheduledFor.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        caption: caption || undefined,
        hashtags: hashtags
          ? hashtags.split(',').map((h) => h.trim().replace(/^#/, ''))
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule post');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content schedule-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">SCHEDULE POST</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Content Preview */}
          {content && (
            <div className="schedule-content-preview">
              {content.mediaUrls[0] && (
                <div className="schedule-preview-media">
                  <img
                    src={content.mediaUrls[0]}
                    alt={content.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="schedule-preview-info">
                <div className="schedule-preview-title">{content.title}</div>
                <div className="schedule-preview-type">
                  {content.type.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div className="modal-section">
            <label className="modal-label">POST TO ACCOUNT</label>
            <div className="schedule-account-grid">
              {feeds.map((feed) => {
                const p = PLATFORMS[feed.platform];
                return (
                  <button
                    key={feed.id}
                    type="button"
                    className={`schedule-account-option ${
                      feedId === feed.id ? 'selected' : ''
                    }`}
                    onClick={() => setFeedId(feed.id)}
                    disabled={isLoading}
                  >
                    <span
                      className="schedule-account-indicator"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="schedule-account-icon">{p.icon}</span>
                    <span className="schedule-account-handle">
                      {feed.handle}
                    </span>
                  </button>
                );
              })}
            </div>
            {feeds.length === 0 && (
              <div className="schedule-no-accounts">
                No accounts connected. Add an account first.
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="modal-section">
            <label className="modal-label">DATE & TIME</label>
            <div className="schedule-datetime">
              <input
                type="date"
                className="schedule-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isLoading}
              />
              <select
                className="schedule-time-select"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isLoading}
              >
                {timeSlots.map((slot) => (
                  <option
                    key={`${slot.hour}:${slot.minute}`}
                    value={`${slot.hour.toString().padStart(2, '0')}:${slot.minute
                      .toString()
                      .padStart(2, '0')}`}
                  >
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caption Override */}
          <div className="modal-section">
            <label className="modal-label">
              CAPTION
              {platform && (
                <span className="modal-label-hint">
                  (max {platform.maxCaptionLength} chars)
                </span>
              )}
            </label>
            <textarea
              className="schedule-caption-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter post caption..."
              rows={4}
              maxLength={platform?.maxCaptionLength}
              disabled={isLoading}
            />
            <div className="schedule-caption-count">
              {caption.length}
              {platform && ` / ${platform.maxCaptionLength}`}
            </div>
          </div>

          {/* Hashtags */}
          <div className="modal-section">
            <label className="modal-label">HASHTAGS</label>
            <input
              type="text"
              className="modal-input"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#trending, #social, #content"
              disabled={isLoading}
            />
            <div className="schedule-hashtag-hint">
              Separate with commas
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="modal-error">
              <span className="modal-error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* Optimal Times Suggestion */}
          <div className="schedule-suggestion">
            <span className="schedule-suggestion-icon">💡</span>
            <span className="schedule-suggestion-text">
              Best times to post:{' '}
              <strong>9:00 AM, 12:00 PM, 6:00 PM</strong>
            </span>
          </div>
        </form>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-button secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="modal-button primary"
            onClick={handleSubmit}
            disabled={isLoading || !feedId || !content}
          >
            {isLoading ? 'SCHEDULING...' : 'SCHEDULE'}
          </button>
        </div>
      </div>
    </div>
  );
}
