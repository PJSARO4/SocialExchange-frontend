/**
 * SOCIAL EXCHANGE - AUTH STORE
 * LocalStorage-based authentication for demo purposes
 * In production, this would use a proper database and JWT tokens
 */

import {
  User,
  UserRole,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  AuthSession,
  AUTH_CONFIG,
  validatePassword,
  validateEmail,
  validateUsername,
} from './types';

const STORAGE_KEYS = {
  USERS: 'sx_users',
  SESSIONS: 'sx_sessions',
  CURRENT_SESSION: 'sx_current_session',
};

// ============================================
// UTILITIES
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Simple hash function for demo (use bcrypt in production!)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256_demo_${Math.abs(hash).toString(16)}`;
}

function verifyHash(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// ============================================
// STORAGE OPERATIONS
// ============================================

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getSessions(): AuthSession[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

function saveSessions(sessions: AuthSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

// ============================================
// AUTH OPERATIONS
// ============================================

export function signup(request: SignupRequest): AuthResponse {
  // Validate all fields
  const emailValidation = validateEmail(request.email);
  if (!emailValidation.isValid) {
    return {
      success: false,
      message: 'Invalid email',
      errors: { email: emailValidation.errors[0] },
    };
  }

  const usernameValidation = validateUsername(request.username);
  if (!usernameValidation.isValid) {
    return {
      success: false,
      message: 'Invalid username',
      errors: { username: usernameValidation.errors[0] },
    };
  }

  const passwordValidation = validatePassword(request.password);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      message: 'Password does not meet requirements',
      errors: { password: passwordValidation.errors.join('. ') },
    };
  }

  if (request.password !== request.confirmPassword) {
    return {
      success: false,
      message: 'Passwords do not match',
      errors: { confirmPassword: 'Passwords do not match' },
    };
  }

  if (!request.acceptTerms) {
    return {
      success: false,
      message: 'You must accept the terms and conditions',
      errors: { acceptTerms: 'Required' },
    };
  }

  // Check for existing user
  const users = getUsers();
  const existingEmail = users.find(u => u.email.toLowerCase() === request.email.toLowerCase());
  if (existingEmail) {
    return {
      success: false,
      message: 'An account with this email already exists',
      errors: { email: 'Email already registered' },
    };
  }

  const existingUsername = users.find(u => u.username.toLowerCase() === request.username.toLowerCase());
  if (existingUsername) {
    return {
      success: false,
      message: 'This username is already taken',
      errors: { username: 'Username already taken' },
    };
  }

  // Create user
  const now = new Date().toISOString();
  const newUser: User = {
    id: generateId(),
    email: request.email.toLowerCase(),
    username: request.username.toLowerCase(),
    displayName: request.displayName,
    role: 'user',
    passwordHash: simpleHash(request.password),
    twoFactorEnabled: false,
    isVerified: false, // Would send verification email
    isActive: true,
    isBanned: false,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  saveUsers(users);

  // Create session
  const session = createSession(newUser.id);

  // Return user without sensitive data
  const { passwordHash, twoFactorSecret, ...safeUser } = newUser;

  return {
    success: true,
    message: 'Account created successfully',
    user: safeUser,
    token: session.token,
  };
}

export function login(request: LoginRequest): AuthResponse {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === request.email.toLowerCase());

  if (!user) {
    return {
      success: false,
      message: 'Invalid email or password',
    };
  }

  // Check if account is locked
  if (user.lockedUntil) {
    const lockExpiry = new Date(user.lockedUntil);
    if (lockExpiry > new Date()) {
      const minutesLeft = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
      return {
        success: false,
        message: `Account is temporarily locked. Try again in ${minutesLeft} minutes.`,
      };
    } else {
      // Unlock the account
      user.lockedUntil = undefined;
      user.failedLoginAttempts = 0;
    }
  }

  // Check if account is banned
  if (user.isBanned) {
    return {
      success: false,
      message: 'This account has been suspended. Please contact support.',
    };
  }

  // Verify password
  if (!verifyHash(request.password, user.passwordHash)) {
    // Increment failed attempts
    user.failedLoginAttempts++;

    if (user.failedLoginAttempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + AUTH_CONFIG.LOCKOUT_DURATION_MS).toISOString();
    }

    user.updatedAt = new Date().toISOString();
    saveUsers(users);

    return {
      success: false,
      message: 'Invalid email or password',
    };
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled && !request.twoFactorCode) {
    return {
      success: false,
      message: 'Two-factor authentication required',
      requiresTwoFactor: true,
    };
  }

  // Update login info
  user.failedLoginAttempts = 0;
  user.lastLoginAt = new Date().toISOString();
  user.lastLoginIp = 'client-side'; // Would get real IP server-side
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  // Create session
  const sessionDuration = request.rememberMe
    ? AUTH_CONFIG.REMEMBER_ME_DURATION_MS
    : AUTH_CONFIG.SESSION_DURATION_MS;
  const session = createSession(user.id, sessionDuration);

  // Return user without sensitive data
  const { passwordHash, twoFactorSecret, ...safeUser } = user;

  return {
    success: true,
    message: 'Login successful',
    user: safeUser,
    token: session.token,
  };
}

export function ownerLogin(
  email: string,
  password: string,
  accessCode: string,
  twoFactorCode: string
): AuthResponse {
  // First, verify the access code
  if (!AUTH_CONFIG.OWNER_ACCESS_CODES.includes(accessCode)) {
    return {
      success: false,
      message: 'Invalid access code',
    };
  }

  // Standard login flow
  const loginResult = login({ email, password, twoFactorCode });

  if (!loginResult.success) {
    return loginResult;
  }

  // Check if user has appropriate role
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return {
      success: false,
      message: 'User not found',
    };
  }

  // Determine role based on access code
  let newRole: UserRole = user.role;
  if (accessCode === 'SXCHANGE-OWNER-2024') {
    newRole = 'owner';
  } else if (accessCode === 'SXCHANGE-DEV-2024') {
    newRole = user.role === 'owner' ? 'owner' : 'developer';
  }

  // Update role if changed
  if (newRole !== user.role) {
    user.role = newRole;
    user.updatedAt = new Date().toISOString();
    saveUsers(users);
  }

  const { passwordHash, twoFactorSecret, ...safeUser } = user;
  safeUser.role = newRole;

  return {
    success: true,
    message: `Owner access granted (${newRole})`,
    user: safeUser,
    token: loginResult.token,
  };
}

export function logout(): void {
  if (typeof window === 'undefined') return;

  const sessionToken = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  if (sessionToken) {
    const sessions = getSessions().filter(s => s.token !== sessionToken);
    saveSessions(sessions);
  }

  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}

export function getCurrentUser(): Omit<User, 'passwordHash' | 'twoFactorSecret'> | null {
  if (typeof window === 'undefined') return null;

  const sessionToken = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  if (!sessionToken) return null;

  const sessions = getSessions();
  const session = sessions.find(s => s.token === sessionToken);

  if (!session) return null;

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    logout();
    return null;
  }

  const users = getUsers();
  const user = users.find(u => u.id === session.userId);

  if (!user) return null;

  const { passwordHash, twoFactorSecret, ...safeUser } = user;
  return safeUser;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(requiredRole: UserRole): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  const roleHierarchy: UserRole[] = ['user', 'creator', 'developer', 'admin', 'owner'];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

function createSession(userId: string, duration: number = AUTH_CONFIG.SESSION_DURATION_MS): AuthSession {
  const now = new Date();
  const session: AuthSession = {
    id: generateId(),
    userId,
    token: `sx_${generateId()}_${Math.random().toString(36).substr(2)}`,
    deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ipAddress: 'client-side',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + duration).toISOString(),
    lastActivityAt: now.toISOString(),
  };

  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, session.token);
  }

  return session;
}

export function refreshSession(): boolean {
  if (typeof window === 'undefined') return false;

  const sessionToken = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
  if (!sessionToken) return false;

  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.token === sessionToken);

  if (sessionIndex === -1) return false;

  sessions[sessionIndex].lastActivityAt = new Date().toISOString();
  sessions[sessionIndex].expiresAt = new Date(
    Date.now() + AUTH_CONFIG.SESSION_DURATION_MS
  ).toISOString();

  saveSessions(sessions);
  return true;
}

// ============================================
// SEED DATA
// ============================================

export function seedAuthIfEmpty(): void {
  if (typeof window === 'undefined') return;

  const users = getUsers();
  if (users.length > 0) return;

  forceResetAuth();
}

// Force reset - clears all auth data and reseeds
export function forceResetAuth(): void {
  if (typeof window === 'undefined') return;

  const now = new Date().toISOString();

  // Create demo users
  const demoUsers: User[] = [
    {
      id: 'owner-001',
      email: 'owner@socialexchange.com',
      username: 'sxowner',
      displayName: 'Platform Owner',
      role: 'owner',
      passwordHash: simpleHash('Owner@2024!Secure'),
      twoFactorEnabled: false,
      isVerified: true,
      isActive: true,
      isBanned: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'dev-001',
      email: 'dev@socialexchange.com',
      username: 'sxdev',
      displayName: 'Platform Developer',
      role: 'developer',
      passwordHash: simpleHash('Dev@2024!Secure'),
      twoFactorEnabled: false,
      isVerified: true,
      isActive: true,
      isBanned: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-user-main',
      email: 'demo@example.com',
      username: 'demouser',
      displayName: 'Demo User',
      role: 'creator',
      passwordHash: simpleHash('Demo@2024!User'),
      twoFactorEnabled: false,
      isVerified: true,
      isActive: true,
      isBanned: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    },
    // PJ's Owner Account
    {
      id: 'pj-owner-001',
      email: 'pjsaro4@gmail.com',
      username: 'pjsaro',
      displayName: 'PJ',
      role: 'owner',
      passwordHash: simpleHash('SocialX@2024!PJ'),
      twoFactorEnabled: false,
      isVerified: true,
      isActive: true,
      isBanned: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Clear existing data
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);

  saveUsers(demoUsers);
  console.log('✅ Auth data reset and reseeded');
}

// Check if auth data needs repair (corrupted or missing required users)
export function repairAuthIfNeeded(): void {
  if (typeof window === 'undefined') return;

  try {
    const users = getUsers();

    // Check if demo user exists and has valid hash
    const demoUser = users.find(u => u.email === 'demo@example.com');
    const pjUser = users.find(u => u.email === 'pjsaro4@gmail.com');

    // If critical users are missing, repair
    if (!demoUser || !pjUser) {
      console.log('⚠️ Auth data corrupted or incomplete, repairing...');
      forceResetAuth();
    }
  } catch (e) {
    console.log('⚠️ Auth data error, resetting...', e);
    forceResetAuth();
  }
}
