'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types for workflow-generated events
export interface WorkflowEvent {
  id: string;
  workflowId: string;
  workflowName: string;
  type: 'scheduled_run' | 'content_scrape' | 'auto_post' | 'analytics_check' | 'content_added';
  scheduledFor: string; // ISO date string
  status: 'pending' | 'running' | 'completed' | 'failed';
  feedId?: string;
  metadata?: {
    contentId?: string;
    platform?: string;
    description?: string;
    repeatFrequency?: string; // 'daily', 'weekly', 'monthly', 'hourly'
  };
  createdAt: string;
  completedAt?: string;
}

// Types for the context
interface WorkflowEventsContextType {
  events: WorkflowEvent[];
  addEvent: (event: Omit<WorkflowEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, updates: Partial<WorkflowEvent>) => void;
  removeEvent: (id: string) => void;
  getEventsForDate: (date: Date) => WorkflowEvent[];
  getEventsForWorkflow: (workflowId: string) => WorkflowEvent[];
  getPendingEvents: () => WorkflowEvent[];
  syncWorkflowEvents: (workflowId: string, workflowName: string, schedule: WorkflowScheduleConfig) => void;
}

// Schedule config for generating recurring events
interface WorkflowScheduleConfig {
  trigger: 'schedule' | 'manual' | 'content_added';
  cronExpression?: string; // For scheduled triggers
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

const STORAGE_KEY = 'se-workflow-events';

// Load events from localStorage
function loadEvents(): WorkflowEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save events to localStorage
function saveEvents(events: WorkflowEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// Parse cron expression and generate dates for next 30 days
function generateScheduledDates(cronExpression: string, startDate: Date, days: number = 30): Date[] {
  const dates: Date[] = [];
  const now = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);

  // Simple cron parsing for common patterns
  // Format: minute hour day-of-month month day-of-week
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return dates;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Handle daily schedules (e.g., "0 9 * * *" = 9 AM every day)
  if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const hourNum = parseInt(hour) || 0;
    const minNum = parseInt(minute) || 0;

    let current = new Date(now);
    current.setHours(hourNum, minNum, 0, 0);
    if (current < now) {
      current.setDate(current.getDate() + 1);
    }

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  // Handle specific days of week (e.g., "0 9 * * 1,3,5" = 9 AM Mon, Wed, Fri)
  else if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
    const hourNum = parseInt(hour) || 0;
    const minNum = parseInt(minute) || 0;
    const targetDays = dayOfWeek.split(',').map(d => parseInt(d));

    let current = new Date(now);
    current.setHours(hourNum, minNum, 0, 0);

    while (current < end) {
      if (targetDays.includes(current.getDay())) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // Handle hourly schedules (e.g., "0 */6 * * *" = every 6 hours)
  else if (hour.startsWith('*/')) {
    const interval = parseInt(hour.slice(2)) || 6;
    const minNum = parseInt(minute) || 0;

    let current = new Date(now);
    current.setMinutes(minNum, 0, 0);

    // Round up to next interval
    const currentHour = current.getHours();
    const nextHour = Math.ceil(currentHour / interval) * interval;
    current.setHours(nextHour);

    if (current < now) {
      current.setHours(current.getHours() + interval);
    }

    while (current < end) {
      dates.push(new Date(current));
      current.setHours(current.getHours() + interval);
    }
  }

  return dates;
}

// Check if two dates are on the same day
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// Context
const WorkflowEventsContext = createContext<WorkflowEventsContextType | null>(null);

// Provider
export function WorkflowEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);

  // Load events on mount
  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  // Save events when they change
  useEffect(() => {
    if (events.length > 0 || loadEvents().length > 0) {
      saveEvents(events);
    }
  }, [events]);

  // Add a new event
  const addEvent = useCallback((event: Omit<WorkflowEvent, 'id' | 'createdAt'>) => {
    const newEvent: WorkflowEvent = {
      ...event,
      id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent.id;
  }, []);

  // Update an event
  const updateEvent = useCallback((id: string, updates: Partial<WorkflowEvent>) => {
    setEvents(prev => prev.map(event =>
      event.id === id ? { ...event, ...updates } : event
    ));
  }, []);

  // Remove an event
  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  }, []);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.scheduledFor);
      return isSameDay(eventDate, date);
    });
  }, [events]);

  // Get events for a specific workflow
  const getEventsForWorkflow = useCallback((workflowId: string) => {
    return events.filter(event => event.workflowId === workflowId);
  }, [events]);

  // Get all pending events
  const getPendingEvents = useCallback(() => {
    return events.filter(event => event.status === 'pending');
  }, [events]);

  // Sync workflow events (regenerate scheduled events for a workflow)
  const syncWorkflowEvents = useCallback((
    workflowId: string,
    workflowName: string,
    schedule: WorkflowScheduleConfig
  ) => {
    // Remove old events for this workflow
    setEvents(prev => prev.filter(event => event.workflowId !== workflowId));

    if (schedule.trigger !== 'schedule' || !schedule.cronExpression) {
      return;
    }

    // Generate new scheduled events
    const startDate = schedule.startDate ? new Date(schedule.startDate) : new Date();
    const scheduledDates = generateScheduledDates(schedule.cronExpression, startDate, 30);

    const newEvents: WorkflowEvent[] = scheduledDates.map(date => ({
      id: `we-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      workflowId,
      workflowName,
      type: 'scheduled_run' as const,
      scheduledFor: date.toISOString(),
      status: 'pending' as const,
      metadata: {
        repeatFrequency: schedule.cronExpression,
      },
      createdAt: new Date().toISOString(),
    }));

    setEvents(prev => [...prev, ...newEvents]);
  }, []);

  const value: WorkflowEventsContextType = {
    events,
    addEvent,
    updateEvent,
    removeEvent,
    getEventsForDate,
    getEventsForWorkflow,
    getPendingEvents,
    syncWorkflowEvents,
  };

  return (
    <WorkflowEventsContext.Provider value={value}>
      {children}
    </WorkflowEventsContext.Provider>
  );
}

// Hook
export function useWorkflowEvents() {
  const context = useContext(WorkflowEventsContext);
  if (!context) {
    throw new Error('useWorkflowEvents must be used within WorkflowEventsProvider');
  }
  return context;
}

export default WorkflowEventsProvider;
