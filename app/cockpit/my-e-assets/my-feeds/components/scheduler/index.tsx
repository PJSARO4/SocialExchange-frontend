"use client";

import React from 'react';

interface SchedulerProps {
  feedId?: string;
  onSchedule?: (schedule: any) => void;
  children?: React.ReactNode;
}

export function Scheduler({ feedId, onSchedule, children }: SchedulerProps) {
  return (
    <div className="scheduler-container" style={{ padding: '1rem' }}>
      <div style={{ color: '#00ffc8', marginBottom: '1rem', fontWeight: 'bold' }}>
        Content Scheduler
      </div>
      <div style={{ color: '#888', fontSize: '0.875rem' }}>
        Schedule content for feed: {feedId || 'N/A'}
      </div>
      {children}
    </div>
  );
}

export default Scheduler;
