'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WeekHeader from './components/WeekHeader';
import TimeSlotGrid from './components/TimeSlotGrid';
import './scheduler.css';

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

export default function SchedulerPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mockScheduledPosts: ScheduledPost[] = [
    {
      id: 'post_1',
      accountId: 'acc_1',
      dayOfWeek: 1,
      hour: 9,
      minute: 0,
      caption: 'New collection dropping tomorrow. Stay tuned for exclusive previews.',
      mediaType: 'image',
      status: 'scheduled',
      platform: 'instagram'
    },
    {
      id: 'post_2',
      accountId: 'acc_1',
      dayOfWeek: 1,
      hour: 14,
      minute: 30,
      caption: 'Behind the scenes of our latest photoshoot. Swipe to see more!',
      mediaType: 'carousel',
      status: 'automated',
      platform: 'instagram'
    },
    {
      id: 'post_3',
      accountId: 'acc_1',
      dayOfWeek: 2,
      hour: 11,
      minute: 0,
      caption: 'Weekend vibes. Here are 5 ways to maximize your productivity.',
      mediaType: 'video',
      status: 'scheduled',
      platform: 'instagram'
    },
    {
      id: 'post_4',
      accountId: 'acc_1',
      dayOfWeek: 4,
      hour: 16,
      minute: 0,
      caption: 'Throwback to our most popular post of the year.',
      mediaType: 'image',
      status: 'automated',
      platform: 'instagram'
    }
  ];

  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleSlotClick = (dayIndex: number, hour: number) => {
    console.log('Create post for:', { dayIndex, hour });
  };

  const handlePostClick = (postId: string) => {
    router.push(`/cockpit/my-e-assets/my-feeds/automation?post=${postId}`);
  };

  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="scheduler-page">
      <div className="scheduler-header">
        <div className="scheduler-title-section">
          <h1 className="scheduler-title">Scheduler</h1>
          <p className="scheduler-subtitle">Plan and schedule your content</p>
        </div>
        <div className="scheduler-actions">
          <button className="scheduler-action-button" onClick={() => router.back()}>
            Back to Feeds
          </button>
          <button className="scheduler-action-button primary" onClick={handleSlotClick.bind(null, 0, 9)}>
            New Post
          </button>
        </div>
      </div>

      <div className="scheduler-controls">
        <button className="scheduler-nav-button" onClick={handlePreviousWeek}>
          ← Previous
        </button>
        <button className="scheduler-today-button" onClick={handleToday}>
          Today
        </button>
        <button className="scheduler-nav-button" onClick={handleNextWeek}>
          Next →
        </button>
      </div>

      <div className="scheduler-calendar">
        <WeekHeader dates={weekDates} />
        <TimeSlotGrid
          dates={weekDates}
          posts={mockScheduledPosts}
          onSlotClick={handleSlotClick}
          onPostClick={handlePostClick}
        />
      </div>
    </div>
  );
}