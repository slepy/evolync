/**
 * Replaces @/database/sync (which needs the Supabase client) with a no-op
 * before a service module is required. Import this first.
 */
const syncPath = require.resolve("@/database/sync");
export const syncCalls: number[] = [];
require.cache[syncPath] = {
  id: syncPath,
  filename: syncPath,
  loaded: true,
  exports: {
    sync: async () => {
      syncCalls.push(Date.now());
      return { success: true, timestamp: Date.now() };
    },
  },
} as any;
