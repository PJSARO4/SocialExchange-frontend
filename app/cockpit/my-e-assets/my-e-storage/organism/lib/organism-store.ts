'use client';

import type {
  OrganismConfig,
  OrganismTask,
  ChatMessage,
  OrganismBehavior,
} from '../types/organism';
import { DEFAULT_BEHAVIORS } from './organism-behaviors';

// ============================================
// LOCALSTORAGE KEYS
// ============================================

const KEYS = {
  CONFIG: 'sx_organism_config',
  TASKS: 'sx_organism_tasks',
  CHAT: 'sx_organism_chat',
  TRAINING: 'sx_organism_training',
} as const;

// ============================================
// GENERIC HELPERS (matching codebase pattern)
// ============================================

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: OrganismConfig = {
  name: 'SYN',
  behaviors: DEFAULT_BEHAVIORS,
  userTraining: '',
  compressionDefaults: {
    platform: 'instagram-square',
    quality: 0.85,
  },
  notifications: true,
  initialized: false,
};

// ============================================
// CONFIG
// ============================================

export function getOrganismConfig(): OrganismConfig {
  const config = getStorage<OrganismConfig>(KEYS.CONFIG, DEFAULT_CONFIG);
  // Merge any new default behaviors that might not exist in saved config
  if (config.behaviors.length < DEFAULT_BEHAVIORS.length) {
    const existingIds = new Set(config.behaviors.map((b) => b.id));
    DEFAULT_BEHAVIORS.forEach((db) => {
      if (!existingIds.has(db.id)) {
        config.behaviors.push(db);
      }
    });
  }
  return config;
}

export function saveOrganismConfig(config: OrganismConfig): void {
  setStorage(KEYS.CONFIG, config);
}

export function updateBehavior(
  behaviorId: string,
  updates: Partial<OrganismBehavior>
): void {
  const config = getOrganismConfig();
  const index = config.behaviors.findIndex((b) => b.id === behaviorId);
  if (index >= 0) {
    config.behaviors[index] = { ...config.behaviors[index], ...updates };
    saveOrganismConfig(config);
  }
}

export function isBehaviorEnabled(behaviorId: string): boolean {
  const config = getOrganismConfig();
  const behavior = config.behaviors.find((b) => b.id === behaviorId);
  return behavior?.enabled ?? false;
}

export function getUserTraining(): string {
  const config = getOrganismConfig();
  return config.userTraining;
}

export function saveUserTraining(training: string): void {
  const config = getOrganismConfig();
  config.userTraining = training;
  saveOrganismConfig(config);
}

// ============================================
// TASK QUEUE
// ============================================

const MAX_TASK_HISTORY = 20;

export function getTaskQueue(): OrganismTask[] {
  return getStorage<OrganismTask[]>(KEYS.TASKS, []);
}

export function saveTaskQueue(tasks: OrganismTask[]): void {
  setStorage(KEYS.TASKS, tasks);
}

export function addTask(task: OrganismTask): void {
  const tasks = getTaskQueue();
  tasks.unshift(task); // newest first
  // Prune old completed/failed tasks
  const active = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'running'
  );
  const done = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed'
  );
  saveTaskQueue([...active, ...done.slice(0, MAX_TASK_HISTORY)]);
}

export function updateTask(
  taskId: string,
  updates: Partial<OrganismTask>
): void {
  const tasks = getTaskQueue();
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index >= 0) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTaskQueue(tasks);
  }
}

export function getRunningTask(): OrganismTask | undefined {
  return getTaskQueue().find((t) => t.status === 'running');
}

export function getPendingTasks(): OrganismTask[] {
  return getTaskQueue().filter((t) => t.status === 'pending');
}

export function getCompletedTasks(): OrganismTask[] {
  return getTaskQueue().filter(
    (t) => t.status === 'completed' || t.status === 'failed'
  );
}

// ============================================
// CHAT HISTORY
// ============================================

const MAX_CHAT_MESSAGES = 50;

export function getChatHistory(): ChatMessage[] {
  return getStorage<ChatMessage[]>(KEYS.CHAT, []);
}

export function saveChatHistory(messages: ChatMessage[]): void {
  // Keep only the latest messages
  setStorage(KEYS.CHAT, messages.slice(-MAX_CHAT_MESSAGES));
}

export function addChatMessage(message: ChatMessage): void {
  const messages = getChatHistory();
  messages.push(message);
  saveChatHistory(messages);
}

export function clearChatHistory(): void {
  setStorage(KEYS.CHAT, []);
}
