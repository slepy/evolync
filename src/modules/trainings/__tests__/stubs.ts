/**
 * Replaces modules that need the Supabase client / network with no-ops
 * before service or hook modules are required. Import this first.
 */
export const syncCalls: number[] = [];

const stub = (request: string, exports: unknown) => {
  const resolved = require.resolve(request);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports } as any;
};

stub("@/database/sync", {
  sync: async () => {
    syncCalls.push(Date.now());
    return { success: true, timestamp: Date.now() };
  },
});
stub("@/config/supabase", { supabase: {} });
