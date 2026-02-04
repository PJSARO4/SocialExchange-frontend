/**
 * SOCIAL EXCHANGE - AUTHENTICATION TYPES
 * Secure authentication system with role-based access
 */

// ============================================
// USER ROLES
// ============================================

export type UserRole = 'user' | 'creator' | 'developer' | 'admin' | 'owner';

export interface RolePermissions {
  canAccessCockpit: boolean;
  canManageFeeds: boolean;
  canListBrand: boolean;
  canAccessOwnerDashboard: boolean;
  canManageUsers: boolean;
  canAccessDevTools: boolean;
  canModifyPlatformSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  user: {
    canAccessCockpit: true,
    canManageFeeds: false,
    canListBrand: false,
    canAccessOwnerDashboard: false,
    canManageUsers: false,
    canAccessDevTools: false,
    canModifyPlatformSettings: false,
  },
  creator: {
    canAccessCockpit: true,
    canManageFeeds: true,
    canListBrand: true,
    canAccessOwnerDashboard: false,
    canManageUsers: false,
    canAccessDevTools: false,
    canModifyPlatformSettings: false,
  },
  developer: {
    canAccessCockpit: true,
    canManageFeeds: true,
    canListBrand: true,
    canAccessOwnerDashboard: true,
    canManageUsers: false,
    canAccessDevTools: true,
    canModifyPlatformSettings: false,
  },
  admin: {
    canAccessCockpit: true,
    canManageFeeds: true,
    canListBrand: true,
    canAccessOwnerDashboard: true,
    canManageUsers: true,
    canAccessDevTools: true,
    canModifyPlatformSettings: false,
  },
  owner: {
    canAccessCockpit: true,
    canManageFeeds: true,
    canListBrand: true,
    canAccessOwnerDashboard: true,
    canManageUsers: true,
    canAccessDevTools: true,
    canModifyPlatformSettings: true,
  },
};

// ============================================
// USER MODEL
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;

  // Security
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // Status
  isVerified: boolean;
  isActive: boolean;
  isBanned: boolean;

  // Security audit
  lastLoginAt?: string;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// AUTH REQUESTS
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  captchaToken: string;
}

export interface OwnerAccessRequest {
  email: string;
  password: string;
  accessCode: string;
  twoFactorCode: string;
}

// ============================================
// AUTH RESPONSES
// ============================================

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'passwordHash' | 'twoFactorSecret'>;
  token?: string;
  requiresTwoFactor?: boolean;
  errors?: Record<string, string>;
}

// ============================================
// SESSION
// ============================================

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

// ============================================
// SECURITY CONFIG
// ============================================

export const AUTH_CONFIG = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,

  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes

  // Session
  SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_DURATION_MS: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Tokens
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d',

  // Owner access
  OWNER_ACCESS_CODES: ['SXCHANGE-OWNER-2024', 'SXCHANGE-DEV-2024'], // Would be env vars in production
} as const;

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`);
  }

  if (AUTH_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (AUTH_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (AUTH_CONFIG.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (AUTH_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
  ];

  if (weakPatterns.some(pattern => pattern.test(password))) {
    errors.push('Password is too common or predictable');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  // Check for disposable email domains (simplified list)
  const disposableDomains = ['tempmail.com', 'throwaway.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    errors.push('Disposable email addresses are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.length > 20) {
    errors.push('Username must be less than 20 characters');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Reserved usernames
  const reserved = ['admin', 'owner', 'system', 'support', 'help', 'api', 'socialexchange'];
  if (reserved.includes(username.toLowerCase())) {
    errors.push('This username is reserved');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
