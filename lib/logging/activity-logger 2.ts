// Stub file - Activity Logger

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum LogCategory {
  AUTH = 'auth',
  NAVIGATION = 'navigation',
  API = 'api',
  USER = 'user',
  SYSTEM = 'system',
  AUDIO = 'audio',
  UI = 'ui',
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
}

const logs: ActivityLog[] = [];

export function log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
  const entry: ActivityLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    level,
    category,
    message,
    data,
  };
  logs.push(entry);
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data || '');
}

export function getLogs(): ActivityLog[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.length = 0;
}

export default { log, getLogs, clearLogs, LogLevel, LogCategory };
