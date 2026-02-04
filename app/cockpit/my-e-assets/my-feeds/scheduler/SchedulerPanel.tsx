'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WeekHeader from '../components/WeekHeader';
import TimeSlotGrid from '../components/TimeSlotGrid';
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

export default function SchedulerPanel() {
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
      platform: 'instagram',
    },
    {
      id: 'post_2',
      accountId: 'acc_1',
      dayOfWeek: 1,
      hour: 14,
      minute: 30,
      caption: 'Behind the scenes of our latest photoshoot.',
      mediaType: 'carousel',
      status: 'automated',
      platform: 'instagram',
    },
    {
      id: 'post_3',
      accountId: 'acc_1',
      dayOfWeek: 3,
      hour: 11,
      minute: 0,
      caption: 'Weekly productivity tips.',
      mediaType: 'video',
      status: 'scheduled',
      platform: 'instagram',
    },
  ];

  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handlePreviousWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleSlotClick = (dayIndex: number, hour: number) => {
    console.log('Create post at:', { dayIndex, hour });
  };

  const handlePostClick = (postId: string) => {
    console.log('Edit post:', postId);
  };

  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="scheduler-panel">
      <div className="scheduler-header">
        <div className="scheduler-title">SCHEDULER</div>
        <button
          className="scheduler-back-button"
          onClick={() => router.back()}
        >
          ← COMMAND CENTER
        </button>
      </div>

      <div className="scheduler-controls">
        <button onClick={handlePreviousWeek}>← PREV</button>
        <button onClick={handleToday}>TODAY</button>
        <button onClick={handleNextWeek}>NEXT →</button>
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
