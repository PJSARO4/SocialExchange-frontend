'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  UserRole,
  ROLE_PERMISSIONS,
  RolePermissions,
} from './types';
import {
  getCurrentUser,
  logout as logoutUser,
  seedAuthIfEmpty,
  refreshSession,
} from './auth-store';

// ============================================
// CONTEXT TYPE
// ============================================

interface AuthContextType {
  user: Omit<User, 'passwordHash' | 'twoFactorSecret'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: RolePermissions | null;
  logout: () => void;
  refreshUser: () => void;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Omit<User, 'passwordHash' | 'twoFactorSecret'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    seedAuthIfEmpty();
    loadUser();

    // Refresh session periodically
    const interval = setInterval(() => {
      if (user) {
        refreshSession();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const loadUser = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const refreshUser = () => {
    loadUser();
  };

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions ? permissions[permission] : false;
  };

  const hasRoleCheck = (requiredRole: UserRole): boolean => {
    if (!user) return false;

    const roleHierarchy: UserRole[] = ['user', 'creator', 'developer', 'admin', 'owner'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    permissions,
    logout,
    refreshUser,
    hasPermission,
    hasRole: hasRoleCheck,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: keyof RolePermissions;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="auth-access-denied-screen">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="auth-access-denied-screen">
        <h2>Access Denied</h2>
        <p>You don't have the required permissions.</p>
      </div>
    );
  }

  return <>{children}</>;
}
