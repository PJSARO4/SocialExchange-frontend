'use client';

import { Feed } from '../types/feed';

interface Props {
  feed: Feed;
}

const format = (v?: number) =>
  typeof v === 'number' ? v.toLocaleString() : '—';

export default function FeedAnalyticsReadout({ feed }: Props) {
  const m = feed.metrics ?? {};

  return (
    <div className="feed-analytics">
      <div className="feed-analytics-row">
        <span>FOLLOWERS</span>
        <span>{format(m.followers)}</span>
      </div>
      <div className="feed-analytics-row">
        <span>ENGAGEMENT</span>
        <span>{format(m.engagement)}</span>
      </div>
      <div className="feed-analytics-row">
        <span>POSTS / WEEK</span>
        <span>{format(m.postsPerWeek)}</span>
      </div>
      <div className="feed-analytics-row">
        <span>UPTIME</span>
        <span>{format(m.uptime)}</span>
      </div>
    </div>
  );
}
