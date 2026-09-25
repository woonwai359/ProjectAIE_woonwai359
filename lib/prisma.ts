import { PrismaClient } from '@prisma/client';

// Standard Next.js dev-mode singleton so hot-reload doesn't exhaust the
// PostgreSQL connection pool for this subsystem's isolated database.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:mysecretpassword@localhost:5432/phatnaree?schema=public';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}