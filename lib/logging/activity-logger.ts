// Stub file - Activity Logger

export type LogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error' | 'critical';
export type LogCategory = 'auth' | 'user' | 'market' | 'content' | 'automation' | 'feeds' | 'system' | 'security' | 'payment' | 'admin';

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  action?: string;
  userName?: string;
  userId?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  data?: any;
}

const logs: ActivityLog[] = [];

export function log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
  const entry: ActivityLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  };
  logs.push(entry);
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data || '');
}

export function getLogs(options?: { limit?: number }): ActivityLog[] {
  const allLogs = [...logs];
  if (options?.limit) {
    return allLogs.slice(-options.limit);
  }
  return allLogs;
}

export function clearLogs(): void {
  logs.length = 0;
}

// Export logger as an alias for compatibility
export const logger = {
  log,
  debug: (category: LogCategory, message: string, data?: any) => log('debug' as LogLevel, category, message, data),
  info: (category: LogCategory, message: string, data?: any) => log('info' as LogLevel, category, message, data),
  warn: (category: LogCategory, message: string, data?: any) => log('warning' as LogLevel, category, message, data),
  error: (category: LogCategory, message: string, data?: any) => log('error' as LogLevel, category, message, data),
  // Feeds namespace for feed connection logging
  feeds: {
    connected: (userId: string, userName: string, platform: string, handle: string) =>
      log('info' as LogLevel, 'feeds' as LogCategory, `Feed connected: ${handle} on ${platform}`, { userId, userName, platform, handle }),
    disconnected: (userId: string, userName: string, platform: string, handle: string) =>
      log('info' as LogLevel, 'feeds' as LogCategory, `Feed disconnected: ${handle} on ${platform}`, { userId, userName, platform, handle }),
  },
  // Automation namespace for automation logging
  automation: {
    enabled: (userId: string, userName: string, handle: string) =>
      log('info' as LogLevel, 'automation' as LogCategory, `Automation enabled for ${handle}`, { userId, userName, handle }),
    disabled: (userId: string, userName: string, handle: string) =>
      log('info' as LogLevel, 'automation' as LogCategory, `Automation disabled for ${handle}`, { userId, userName, handle }),
  },
  // Market namespace for trading and wallet logging
  market: {
    deposit: (userId: string, userName: string, usdAmount: number, coinsReceived: number) =>
      log('info' as LogLevel, 'market' as LogCategory, `User deposited ${usdAmount.toFixed(2)} USD for ${coinsReceived.toFixed(2)} coins`, { userId, userName, usdAmount, coinsReceived }),
    withdrawal: (userId: string, userName: string, coinAmount: number, usdReceived: number) =>
      log('info' as LogLevel, 'market' as LogCategory, `User withdrew ${coinAmount.toFixed(2)} coins for ${usdReceived.toFixed(2)} USD`, { userId, userName, coinAmount, usdReceived }),
    trade: (userId: string, userName: string, side: string, ticker: string, quantity: number, price: number) =>
      log('info' as LogLevel, 'market' as LogCategory, `User executed ${side} trade: ${quantity} shares of $${ticker} @ ${price.toFixed(4)} coins`, { userId, userName, side, ticker, quantity, price }),
    ipo: (userId: string, userName: string, ticker: string, initialPrice: number, sharesIssued: number) =>
      log('info' as LogLevel, 'market' as LogCategory, `IPO created: $${ticker} at ${initialPrice.toFixed(4)} coins with ${sharesIssued} shares`, { userId, userName, ticker, initialPrice, sharesIssued }),
  },
};

// Seed demo logs for development/testing
export function seedDemoLogs(): void {
  const demoLogs = [
    { level: 'info' as LogLevel, category: 'system' as LogCategory, message: 'Application started', action: 'start' },
    { level: 'info' as LogLevel, category: 'auth' as LogCategory, message: 'User authenticated successfully', action: 'login', userName: 'Demo User', userId: '123' },
    { level: 'info' as LogLevel, category: 'feeds' as LogCategory, message: 'API request completed', action: 'fetch', data: { endpoint: '/api/feeds' } },
    { level: 'warning' as LogLevel, category: 'system' as LogCategory, message: 'High memory usage detected', action: 'alert' },
    { level: 'success' as LogLevel, category: 'content' as LogCategory, message: 'Content published', action: 'publish', userName: 'John Doe', userId: '456', targetId: 'post_789', targetType: 'post' },
    { level: 'error' as LogLevel, category: 'payment' as LogCategory, message: 'Payment processing failed', action: 'process', userName: 'Jane Smith', userId: '789', metadata: { errorCode: 'ERR_001' } },
  ];

  demoLogs.forEach(({ level, category, message, action, userName, userId, targetId, targetType, data, metadata }) => {
    const entry: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      action,
      userName,
      userId,
      targetId,
      targetType,
      data,
      metadata,
    };
    logs.push(entry);
  });
}

// Color scheme interface
export interface ColorScheme {
  bg: string;
  text: string;
  border: string;
  indicator: string;
  pulse?: boolean;
  iconName?: string;
}

// Color mapping for log levels
export const LEVEL_COLORS: Record<LogLevel, ColorScheme> = {
  debug: {
    bg: '#1a1a2e',
    text: '#a0a0a0',
    border: '#404050',
    indicator: '#808080',
  },
  info: {
    bg: '#1a2a3a',
    text: '#60a0ff',
    border: '#3060b0',
    indicator: '#4080ff',
  },
  success: {
    bg: '#1a3a1a',
    text: '#60ff60',
    border: '#308030',
    indicator: '#40ff40',
    pulse: true,
  },
  warning: {
    bg: '#3a2a1a',
    text: '#ffb040',
    border: '#b08030',
    indicator: '#ff9020',
    pulse: true,
  },
  error: {
    bg: '#3a1a1a',
    text: '#ff6060',
    border: '#b03030',
    indicator: '#ff4040',
    pulse: true,
  },
  critical: {
    bg: '#4a0a0a',
    text: '#ff2020',
    border: '#c01010',
    indicator: '#ff0000',
    pulse: true,
  },
};

// Color mapping for log categories
export const LOG_COLORS: Record<LogCategory, ColorScheme & { iconName?: string }> = {
  auth: {
    bg: '#2a1a3a',
    text: '#d060ff',
    border: '#8030b0',
    indicator: '#d040ff',
    iconName: 'Lock',
  },
  user: {
    bg: '#2a3a1a',
    text: '#ff60d0',
    border: '#b03080',
    indicator: '#ff40c0',
    iconName: 'User',
  },
  market: {
    bg: '#1a2a3a',
    text: '#60d0ff',
    border: '#3080b0',
    indicator: '#40c0ff',
    iconName: 'ShoppingCart',
  },
  content: {
    bg: '#2a2a1a',
    text: '#ffc060',
    border: '#b08030',
    indicator: '#ffb040',
    iconName: 'FileText',
  },
  automation: {
    bg: '#1a3a2a',
    text: '#60ff80',
    border: '#308050',
    indicator: '#40ff60',
    iconName: 'Zap',
  },
  feeds: {
    bg: '#1a1a3a',
    text: '#6080ff',
    border: '#3050b0',
    indicator: '#4060ff',
    iconName: 'ClipboardList',
  },
  system: {
    bg: '#3a2a1a',
    text: '#ffb060',
    border: '#b07030',
    indicator: '#ff9040',
    iconName: 'Settings',
  },
  security: {
    bg: '#3a1a1a',
    text: '#ff8060',
    border: '#b05030',
    indicator: '#ff6040',
    iconName: 'Shield',
  },
  payment: {
    bg: '#1a3a1a',
    text: '#60ff60',
    border: '#308030',
    indicator: '#40ff40',
    iconName: 'CreditCard',
  },
  admin: {
    bg: '#2a1a2a',
    text: '#ff60ff',
    border: '#8030b0',
    indicator: '#ff40ff',
    iconName: 'MoreVertical',
  },
};

// Subscribe to log updates (stub - returns unsubscribe function)
type LogSubscriber = (logs: ActivityLog[]) => void;
const subscribers: LogSubscriber[] = [];

export function subscribeToLogs(callback: LogSubscriber): () => void {
  subscribers.push(callback);
  // Immediately call with current logs
  callback(getLogs());
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

export default { log, logger, getLogs, clearLogs, seedDemoLogs, LEVEL_COLORS, LOG_COLORS, subscribeToLogs };
