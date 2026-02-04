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

// Export logger as an alias for compatibility
export const logger = {
  log,
  debug: (category: LogCategory, message: string, data?: any) => log(LogLevel.DEBUG, category, message, data),
  info: (category: LogCategory, message: string, data?: any) => log(LogLevel.INFO, category, message, data),
  warn: (category: LogCategory, message: string, data?: any) => log(LogLevel.WARN, category, message, data),
  error: (category: LogCategory, message: string, data?: any) => log(LogLevel.ERROR, category, message, data),
};

// Seed demo logs for development/testing
export function seedDemoLogs(): void {
  const demoLogs = [
    { level: LogLevel.INFO, category: LogCategory.SYSTEM, message: 'Application started' },
    { level: LogLevel.INFO, category: LogCategory.AUTH, message: 'User authenticated successfully' },
    { level: LogLevel.DEBUG, category: LogCategory.API, message: 'API request completed', data: { endpoint: '/api/feeds' } },
    { level: LogLevel.WARN, category: LogCategory.SYSTEM, message: 'High memory usage detected' },
  ];

  demoLogs.forEach(({ level, category, message, data }) => {
    log(level, category, message, data);
  });
}

export default { log, logger, getLogs, clearLogs, seedDemoLogs, LogLevel, LogCategory };
