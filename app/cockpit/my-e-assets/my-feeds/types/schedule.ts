'use client';

import { ContentItem } from './content';
import { Platform } from './feed';

// ============================================
// SCHEDULED POST
// ============================================

export interface ScheduledPost {
  id: string;
  contentId: string;
  feedId: string;
  platform: Platform;

  // Schedule
  scheduledFor: string;         // ISO datetime
  timezone: string;

  // Content snapshot (in case content is edited)
  caption: string;
  mediaUrls: string[];
  hashtags?: string[];

  // Status
  status: 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
  postedAt?: string;
  errorMessage?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CALENDAR VIEW TYPES
// ============================================

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: ScheduledPost[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

// ============================================
// TIME SLOT
// ============================================

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;          // e.g., "9:00 AM"
  posts: ScheduledPost[];
}

// ============================================
// OPTIMAL TIMES (AI suggested)
// ============================================

export interface OptimalTime {
  dayOfWeek: number;      // 0-6 (Sun-Sat)
  hour: number;
  minute: number;
  score: number;          // 0-100 engagement score
  reason: string;
}

// ============================================
// CREATE SCHEDULE PAYLOAD
// ============================================

export interface CreateSchedulePayload {
  contentId: string;
  feedId: string;
  scheduledFor: string;
  timezone?: string;
  caption?: string;       // Override content caption
  hashtags?: string[];    // Override content hashtags
}

// ============================================
// SCHEDULE FILTERS
// ============================================

export interface ScheduleFilters {
  feedId?: string;
  status?: ScheduledPost['status'];
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const isPM = hour >= 12;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
      slots.push({ hour, minute, label, posts: [] });
    }
  }
  return slots;
}

export function getWeekDays(): string[] {
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
}

export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const days: CalendarDay[] = [];

  // Previous month padding
  const prevMonth = new Date(year, month, 0);
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      posts: [],
    });
  }

  // Current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      posts: [],
    });
  }

  // Next month padding
  const remaining = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      posts: [],
    });
  }

  return days;
}
