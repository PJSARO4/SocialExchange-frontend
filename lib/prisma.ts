import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient singleton for production
// Prevents multiple connections in development due to hot-reloading

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    transactionOptions: {
      timeout: 30000,        // 30 seconds (increased from default 5s)
      maxWait: 5000,         // 5 seconds to acquire lock
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Prevent deadlocks
    },
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
