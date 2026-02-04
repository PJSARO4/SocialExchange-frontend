/**
 * Activity Logger Service
 *
 * Comprehensive logging system for owner/admin accounts
 * Color-coded by action type for easy visual scanning
 */

// ============================================
// LOG TYPES & CATEGORIES
// ============================================

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'critical';

export type LogCategory =
  | 'auth'           // Login, logout, session
  | 'user'           // User actions, profile updates
  | 'market'         // Trading, IPO, investments
  | 'content'        // Posts, uploads, scheduling
  | 'automation'     // Autopilot, scheduled tasks
  | 'feeds'          // Feed connections, sync
  | 'system'         // System events, maintenance
  | 'security'       // Security alerts, suspicious activity
  | 'payment'        // Transactions, deposits, withdrawals
  | 'admin';         // Admin actions

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  action: string;
  message: string;
  userId?: string;
  userName?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// COLOR SCHEME BY CATEGORY
// ============================================

export const LOG_COLORS: Record<LogCategory, { bg: string; text: string; border: string; icon: string }> = {
  auth: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.4)',
    icon: '🔐',
  },
  user: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.4)',
    icon: '👤',
  },
  market: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#34d399',
    border: 'rgba(16, 185, 129, 0.4)',
    icon: '📈',
  },
  content: {
    bg: 'rgba(236, 72, 153, 0.15)',
    text: '#f472b6',
    border: 'rgba(236, 72, 153, 0.4)',
    icon: '📝',
  },
  automation: {
    bg: 'rgba(63, 255, 220, 0.15)',
    text: '#3fffdc',
    border: 'rgba(63, 255, 220, 0.4)',
    icon: '🤖',
  },
  feeds: {
    bg: 'rgba(251, 146, 60, 0.15)',
    text: '#fb923c',
    border: 'rgba(251, 146, 60, 0.4)',
    icon: '📱',
  },
  system: {
    bg: 'rgba(148, 163, 184, 0.15)',
    text: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.4)',
    icon: '⚙️',
  },
  security: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#f87171',
    border: 'rgba(239, 68, 68, 0.4)',
    icon: '🛡️',
  },
  payment: {
    bg: 'rgba(250, 204, 21, 0.15)',
    text: '#fbbf24',
    border: 'rgba(250, 204, 21, 0.4)',
    icon: '💰',
  },
  admin: {
    bg: 'rgba(168, 85, 247, 0.15)',
    text: '#c084fc',
    border: 'rgba(168, 85, 247, 0.4)',
    icon: '👑',
  },
};

export const LEVEL_COLORS: Record<LogLevel, { indicator: string; pulse: boolean }> = {
  info: { indicator: '#60a5fa', pulse: false },
  success: { indicator: '#34d399', pulse: false },
  warning: { indicator: '#fbbf24', pulse: true },
  error: { indicator: '#f87171', pulse: true },
  critical: { indicator: '#ef4444', pulse: true },
};

// ============================================
// IN-MEMORY LOG STORE (Demo Mode)
// ============================================

const MAX_LOGS = 500;
let activityLogs: ActivityLog[] = [];
let logSubscribers: Set<(logs: ActivityLog[]) => void> = new Set();

// Generate unique ID
const generateId = () => `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================
// CORE LOGGING FUNCTIONS
// ============================================

export function logActivity(
  category: LogCategory,
  action: string,
  message: string,
  options: {
    level?: LogLevel;
    userId?: string;
    userName?: string;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, unknown>;
  } = {}
): ActivityLog {
  const log: ActivityLog = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level: options.level || 'info',
    category,
    action,
    message,
    userId: options.userId,
    userName: options.userName,
    targetId: options.targetId,
    targetType: options.targetType,
    metadata: options.metadata,
  };

  // Add to store (most recent first)
  activityLogs = [log, ...activityLogs].slice(0, MAX_LOGS);

  // Notify subscribers
  logSubscribers.forEach(callback => callback([...activityLogs]));

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = LOG_COLORS[category];
    console.log(
      `%c${color.icon} [${category.toUpperCase()}] ${action}: ${message}`,
      `color: ${color.text}; font-weight: bold;`
    );
  }

  return log;
}

// ============================================
// CATEGORY-SPECIFIC HELPERS
// ============================================

export const logger = {
  // Auth events
  auth: {
    login: (userId: string, userName: string, method: string = 'credentials') =>
      logActivity('auth', 'LOGIN', `${userName} logged in via ${method}`, {
        level: 'success',
        userId,
        userName,
        metadata: { method },
      }),
    logout: (userId: string, userName: string) =>
      logActivity('auth', 'LOGOUT', `${userName} logged out`, {
        level: 'info',
        userId,
        userName,
      }),
    sessionExpired: (userId: string) =>
      logActivity('auth', 'SESSION_EXPIRED', 'User session expired', {
        level: 'warning',
        userId,
      }),
    loginFailed: (email: string, reason: string) =>
      logActivity('auth', 'LOGIN_FAILED', `Login failed for ${email}: ${reason}`, {
        level: 'warning',
        metadata: { email, reason },
      }),
  },

  // User actions
  user: {
    profileUpdate: (userId: string, userName: string, fields: string[]) =>
      logActivity('user', 'PROFILE_UPDATE', `${userName} updated profile: ${fields.join(', ')}`, {
        level: 'info',
        userId,
        userName,
        metadata: { fields },
      }),
    settingsChange: (userId: string, userName: string, setting: string, value: unknown) =>
      logActivity('user', 'SETTINGS_CHANGE', `${userName} changed ${setting}`, {
        level: 'info',
        userId,
        userName,
        metadata: { setting, value },
      }),
  },

  // Market/Trading events
  market: {
    trade: (userId: string, userName: string, side: 'BUY' | 'SELL', ticker: string, shares: number, price: number) =>
      logActivity('market', side, `${userName} ${side === 'BUY' ? 'bought' : 'sold'} ${shares} shares of ${ticker} @ $${price.toFixed(4)}`, {
        level: 'success',
        userId,
        userName,
        targetId: ticker,
        targetType: 'brand',
        metadata: { side, shares, price, total: shares * price },
      }),
    ipo: (userId: string, userName: string, ticker: string, initialPrice: number, shares: number) =>
      logActivity('market', 'IPO', `${userName} launched IPO: ${ticker} @ $${initialPrice.toFixed(4)} (${shares} shares)`, {
        level: 'success',
        userId,
        userName,
        targetId: ticker,
        targetType: 'brand',
        metadata: { initialPrice, shares },
      }),
    deposit: (userId: string, userName: string, amount: number, coins: number) =>
      logActivity('market', 'DEPOSIT', `${userName} deposited $${amount.toFixed(2)} for ${coins} SExCOINS`, {
        level: 'success',
        userId,
        userName,
        metadata: { usdAmount: amount, coins },
      }),
    withdrawal: (userId: string, userName: string, coins: number, netUsd: number) =>
      logActivity('market', 'WITHDRAWAL', `${userName} withdrew ${coins} SExCOINS for $${netUsd.toFixed(2)}`, {
        level: 'info',
        userId,
        userName,
        metadata: { coins, netUsd },
      }),
  },

  // Content events
  content: {
    created: (userId: string, userName: string, contentType: string, title: string) =>
      logActivity('content', 'CREATED', `${userName} created ${contentType}: "${title}"`, {
        level: 'success',
        userId,
        userName,
        metadata: { contentType, title },
      }),
    scheduled: (userId: string, userName: string, platform: string, scheduledFor: string) =>
      logActivity('content', 'SCHEDULED', `${userName} scheduled post for ${platform} at ${scheduledFor}`, {
        level: 'info',
        userId,
        userName,
        metadata: { platform, scheduledFor },
      }),
    published: (userId: string, userName: string, platform: string, postId: string) =>
      logActivity('content', 'PUBLISHED', `Post published to ${platform}`, {
        level: 'success',
        userId,
        userName,
        targetId: postId,
        targetType: 'post',
        metadata: { platform },
      }),
    deleted: (userId: string, userName: string, contentId: string) =>
      logActivity('content', 'DELETED', `${userName} deleted content`, {
        level: 'warning',
        userId,
        userName,
        targetId: contentId,
        targetType: 'content',
      }),
  },

  // Automation events
  automation: {
    enabled: (userId: string, userName: string, feedHandle: string) =>
      logActivity('automation', 'ENABLED', `${userName} enabled autopilot for @${feedHandle}`, {
        level: 'success',
        userId,
        userName,
        metadata: { feedHandle },
      }),
    disabled: (userId: string, userName: string, feedHandle: string) =>
      logActivity('automation', 'DISABLED', `${userName} disabled autopilot for @${feedHandle}`, {
        level: 'info',
        userId,
        userName,
        metadata: { feedHandle },
      }),
    taskExecuted: (taskType: string, feedHandle: string, result: 'success' | 'failed') =>
      logActivity('automation', 'TASK_EXECUTED', `Automation ${taskType} for @${feedHandle}: ${result}`, {
        level: result === 'success' ? 'success' : 'error',
        metadata: { taskType, feedHandle, result },
      }),
  },

  // Feed events
  feeds: {
    connected: (userId: string, userName: string, platform: string, handle: string) =>
      logActivity('feeds', 'CONNECTED', `${userName} connected ${platform} account: @${handle}`, {
        level: 'success',
        userId,
        userName,
        metadata: { platform, handle },
      }),
    disconnected: (userId: string, userName: string, platform: string, handle: string) =>
      logActivity('feeds', 'DISCONNECTED', `${userName} disconnected ${platform} account: @${handle}`, {
        level: 'warning',
        userId,
        userName,
        metadata: { platform, handle },
      }),
    syncComplete: (platform: string, handle: string, itemsSynced: number) =>
      logActivity('feeds', 'SYNC_COMPLETE', `Synced ${itemsSynced} items from @${handle} (${platform})`, {
        level: 'info',
        metadata: { platform, handle, itemsSynced },
      }),
    syncFailed: (platform: string, handle: string, error: string) =>
      logActivity('feeds', 'SYNC_FAILED', `Failed to sync @${handle} (${platform}): ${error}`, {
        level: 'error',
        metadata: { platform, handle, error },
      }),
  },

  // System events
  system: {
    startup: () =>
      logActivity('system', 'STARTUP', 'System initialized', { level: 'info' }),
    maintenance: (action: string) =>
      logActivity('system', 'MAINTENANCE', action, { level: 'warning' }),
    error: (component: string, error: string) =>
      logActivity('system', 'ERROR', `Error in ${component}: ${error}`, {
        level: 'error',
        metadata: { component, error },
      }),
    apiCall: (endpoint: string, method: string, status: number) =>
      logActivity('system', 'API_CALL', `${method} ${endpoint} → ${status}`, {
        level: status >= 400 ? 'error' : 'info',
        metadata: { endpoint, method, status },
      }),
  },

  // Security events
  security: {
    suspiciousActivity: (userId: string, activity: string, details: string) =>
      logActivity('security', 'SUSPICIOUS', `Suspicious activity detected: ${activity}`, {
        level: 'critical',
        userId,
        metadata: { activity, details },
      }),
    accessDenied: (userId: string, resource: string) =>
      logActivity('security', 'ACCESS_DENIED', `Access denied to ${resource}`, {
        level: 'warning',
        userId,
        metadata: { resource },
      }),
    passwordChanged: (userId: string, userName: string) =>
      logActivity('security', 'PASSWORD_CHANGED', `${userName} changed their password`, {
        level: 'info',
        userId,
        userName,
      }),
  },

  // Payment events
  payment: {
    transactionComplete: (userId: string, userName: string, type: string, amount: number) =>
      logActivity('payment', 'TRANSACTION', `${userName} completed ${type}: $${amount.toFixed(2)}`, {
        level: 'success',
        userId,
        userName,
        metadata: { type, amount },
      }),
    transactionFailed: (userId: string, userName: string, type: string, reason: string) =>
      logActivity('payment', 'FAILED', `${userName} transaction failed: ${reason}`, {
        level: 'error',
        userId,
        userName,
        metadata: { type, reason },
      }),
  },

  // Admin events
  admin: {
    action: (adminId: string, adminName: string, action: string, target: string) =>
      logActivity('admin', 'ACTION', `Admin ${adminName}: ${action} on ${target}`, {
        level: 'warning',
        userId: adminId,
        userName: adminName,
        metadata: { action, target },
      }),
    userBanned: (adminId: string, adminName: string, targetUserId: string, reason: string) =>
      logActivity('admin', 'USER_BANNED', `Admin ${adminName} banned user: ${reason}`, {
        level: 'critical',
        userId: adminId,
        userName: adminName,
        targetId: targetUserId,
        targetType: 'user',
        metadata: { reason },
      }),
    configChange: (adminId: string, adminName: string, setting: string, oldValue: unknown, newValue: unknown) =>
      logActivity('admin', 'CONFIG_CHANGE', `Admin ${adminName} changed ${setting}`, {
        level: 'warning',
        userId: adminId,
        userName: adminName,
        metadata: { setting, oldValue, newValue },
      }),
  },
};

// ============================================
// SUBSCRIPTION & RETRIEVAL
// ============================================

export function subscribeToLogs(callback: (logs: ActivityLog[]) => void): () => void {
  logSubscribers.add(callback);
  // Immediately call with current logs
  callback([...activityLogs]);

  // Return unsubscribe function
  return () => {
    logSubscribers.delete(callback);
  };
}

export function getLogs(options: {
  limit?: number;
  category?: LogCategory;
  level?: LogLevel;
  userId?: string;
  since?: Date;
} = {}): ActivityLog[] {
  let filtered = [...activityLogs];

  if (options.category) {
    filtered = filtered.filter(log => log.category === options.category);
  }

  if (options.level) {
    filtered = filtered.filter(log => log.level === options.level);
  }

  if (options.userId) {
    filtered = filtered.filter(log => log.userId === options.userId);
  }

  if (options.since) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= options.since!);
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function clearLogs(): void {
  activityLogs = [];
  logSubscribers.forEach(callback => callback([]));
}

// ============================================
// SEED DEMO LOGS (for initial system startup only)
// ============================================

export function seedDemoLogs(): void {
  // Clear existing
  activityLogs = [];

  // Only add system startup log - no fake user activity
  logger.system.startup();
}
