// vitest.setup.ts
import "dotenv/config";

// Ensure no stale cached Prisma client across test runs
delete globalThis.prisma;
