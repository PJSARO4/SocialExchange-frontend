'use client';

interface UpcomingPost {
  id: number;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin';
  feedName: string;
  scheduledDate: string;
  scheduledTime: string;
  caption: string;
  status: 'scheduled' | 'draft' | 'automated';
}

interface Props {
  upcomingPosts: UpcomingPost[];
  onNavigateToFeeds: () => void;
}

export default function ManagementHubPanel({
  upcomingPosts,
  onNavigateToFeeds,
}: Props) {
  const platformIcon = (platform: UpcomingPost['platform']) => {
    switch (platform) {
      case 'instagram':
        return '📷';
      case 'twitter':
        return '🐦';
      case 'tiktok':
        return '🎵';
      case 'youtube':
        return '📺';
      case 'linkedin':
        return '💼';
      default:
        return '📱';
    }
  };

  const truncate = (text: string, max = 60) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

  return (
    <div className="panel panel-management-hub">
      <div className="panel-header">
        <h2 className="panel-title">Management Hub — Upcoming Posts</h2>
      </div>

      <div className="panel-body">
        {upcomingPosts.length === 0 ? (
          <div className="management-hub-empty">
            <div className="management-hub-empty-icon">📅</div>
            <div className="management-hub-empty-text">
              No upcoming posts scheduled
            </div>
          </div>
        ) : (
          upcomingPosts.map(post => (
            <div
              key={post.id}
              className="management-hub-post"
              onClick={onNavigateToFeeds}
            >
              <div className="management-hub-post-header">
                <div className="management-hub-post-platform">
                  <span className="platform-icon">
                    {platformIcon(post.platform)}
                  </span>
                  <span className="platform-feed-name">
                    {post.feedName}
                  </span>
                </div>

                <span
                  className={`management-hub-post-status status-${post.status}`}
                >
                  {post.status}
                </span>
              </div>

              <div className="management-hub-post-schedule">
                <span>{post.scheduledDate}</span>
                <span className="schedule-separator">•</span>
                <span>{post.scheduledTime}</span>
              </div>

              <div className="management-hub-post-caption">
                {truncate(post.caption)}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onNavigateToFeeds}
        className="panel-action-button"
      >
        Manage Feeds & Automation
      </button>
    </div>
  );
}
