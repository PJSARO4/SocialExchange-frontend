/**
 * Auth Configuration
 *
 * NextAuth.js configuration for Social Exchange
 * This is a stub for the market system - full implementation needed
 */

import type { NextAuthOptions } from 'next-auth';

// Placeholder auth options - implement with real providers
export const authOptions: NextAuthOptions = {
  providers: [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

// Type augmentation for session user
declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
