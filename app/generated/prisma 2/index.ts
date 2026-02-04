// Stub file - Prisma Client
// Run `npx prisma generate` to generate the real client

export class PrismaClient {
  feed = {
    findMany: async (args?: any) => [],
    findUnique: async (args?: any) => null,
    create: async (args?: any) => ({}),
    update: async (args?: any) => ({}),
    delete: async (args?: any) => ({}),
    count: async (args?: any) => 0,
  };

  user = {
    findMany: async (args?: any) => [],
    findUnique: async (args?: any) => null,
    create: async (args?: any) => ({}),
    update: async (args?: any) => ({}),
    delete: async (args?: any) => ({}),
  };

  account = {
    findMany: async (args?: any) => [],
    findUnique: async (args?: any) => null,
    create: async (args?: any) => ({}),
    update: async (args?: any) => ({}),
    delete: async (args?: any) => ({}),
  };

  transaction = {
    findMany: async (args?: any) => [],
    findUnique: async (args?: any) => null,
    create: async (args?: any) => ({}),
  };

  async $connect() {
    console.log('[Prisma Stub] Connected');
  }

  async $disconnect() {
    console.log('[Prisma Stub] Disconnected');
  }
}

export default PrismaClient;
