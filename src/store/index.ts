import { create } from "zustand";

// Define Supabase types locally to avoid import issues with Metro bundler
export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: User;
  [key: string]: any;
}

// ============================================================================
// Types
// ============================================================================

export interface AuthError {
  code:
    | "invalid_credentials"
    | "network_error"
    | "session_expired"
    | "too_many_requests"
    | "email_not_confirmed"
    | "unknown";
  message: string;
  recoverable: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
}

// User School Membership (for non-organization owners)
export interface SchoolMembership {
  memberId: string;      // school_member.id
  schoolId: string;      // school.id
  organizationId: string; // school.organization_id
}

// ============================================================================
// Sync State Types
// ============================================================================

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  lastSyncError: string | null;
  isOnline: boolean;
}

// ============================================================================
// Store Interface
// ============================================================================

interface AppState {
  // Legacy auth (zachowane dla kompatybilności wstecznej)
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;

  // Auth State
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;

  // Organization State (for organization owners)
  organization: Organization | null;
  setOrganization: (organization: Organization | null) => void;

  // School Memberships State (for non-organization owners)
  schoolMemberships: SchoolMembership[];
  activeMembershipId: string | null;
  setSchoolMemberships: (memberships: SchoolMembership[]) => void;
  setActiveMembershipId: (memberId: string | null) => void;
  addSchoolMembership: (membership: SchoolMembership) => void;
  getActiveMembership: () => SchoolMembership | null;

  // Sync State (Global)
  sync: SyncState;
  setSyncState: (state: Partial<SyncState>) => void;
  performSync: (force?: boolean) => Promise<any>;
  resetAndSync: () => Promise<any>;

  // Auth Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;

  // Helper
  isAuthenticatedFull: () => boolean;
}

// ============================================================================
// Store Implementation
// ============================================================================

import { resetLocalDatabaseExceptOrganizations } from "@/database";
import { shouldSync, sync } from "@/database/sync";

const LAST_SYNC_KEY = "@evolync:lastSync";
const AUTO_SYNC_INTERVAL = 5; // minutes

export const useStore = create<AppState>()((set, get) => ({
  // Legacy state
  isAuthenticated: false,
  setAuthenticated: (status) => set({ isAuthenticated: status }),

  // Auth state
  user: null,
  session: null,
  isLoading: false,
  error: null,

  // Organization state
  organization: null,
  setOrganization: (organization) => set({ organization }),

  // School memberships state
  schoolMemberships: [],
  activeMembershipId: null,
  setSchoolMemberships: (schoolMemberships) => set({ schoolMemberships }),
  setActiveMembershipId: (activeMembershipId) => set({ activeMembershipId }),
  addSchoolMembership: (membership) =>
    set((prev) => {
      const exists = prev.schoolMemberships.some(
        (m) => m.memberId === membership.memberId,
      );
      if (exists) return prev;
      const next = [...prev.schoolMemberships, membership];
      return {
        schoolMemberships: next,
        activeMembershipId: prev.activeMembershipId ?? membership.memberId,
      };
    }),
  getActiveMembership: () => {
    const state = get();
    return (
      state.schoolMemberships.find(
        (m) => m.memberId === state.activeMembershipId,
      ) ?? null
    );
  },

  // Sync state
  sync: {
    isSyncing: false,
    lastSyncTime: null,
    lastSyncError: null,
    isOnline: true,
  },
  setSyncState: (state) => {
    set((prev) => ({
      sync: { ...prev.sync, ...state },
    }));
  },

  // Sync action
  performSync: async (force = false) => {
    const state = get();

    // Check if sync is needed
    if (!force && !shouldSync(state.sync.lastSyncTime, AUTO_SYNC_INTERVAL)) {
      return {
        success: true,
        timestamp: state.sync.lastSyncTime || Date.now(),
      };
    }

    // Check if already syncing
    if (state.sync.isSyncing) {
      return {
        success: false,
        error: "Sync already in progress",
        timestamp: Date.now(),
      };
    }

    // Start sync
    set((prev) => ({
      sync: {
        ...prev.sync,
        isSyncing: true,
        lastSyncError: null,
      },
    }));

    try {
      const result = await sync();

      if (result.success) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.setItem(LAST_SYNC_KEY, result.timestamp.toString());

        set((prev) => ({
          sync: {
            ...prev.sync,
            isSyncing: false,
            lastSyncTime: result.timestamp,
            lastSyncError: null,
          },
        }));
      } else {
        set((prev) => ({
          sync: {
            ...prev.sync,
            isSyncing: false,
            lastSyncError: result.error || "Unknown error",
          },
        }));

        // Only log as warning for expected errors like no session
        if (result.error === "No active session") {
          console.log("[useStore] Sync skipped: No active session");
        } else {
          console.warn("[useStore] Sync failed:", result.error || "(no error message)", result);
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      set((prev) => ({
        sync: {
          ...prev.sync,
          isSyncing: false,
          lastSyncError: errorMessage,
        },
      }));

      console.error("[useStore] Sync exception:", error);

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  },

  // Reset local database and sync fresh data from server
  resetAndSync: async () => {
    const state = get();

    // Log user state at start
    console.log(`[resetAndSync] Starting reset and sync...`);
    console.log(`[resetAndSync] Current user: ${state.user?.id || 'NONE'}`);
    console.log(`[resetAndSync] Has session: ${!!state.session}`);

    // Check if user is authenticated
    if (!state.user?.id) {
      console.error('[resetAndSync] Cannot reset and sync - no authenticated user');
      return {
        success: false,
        error: "No authenticated user",
        timestamp: Date.now(),
      };
    }

    // Check if already syncing
    if (state.sync.isSyncing) {
      return {
        success: false,
        error: "Sync already in progress",
        timestamp: Date.now(),
      };
    }

    set((prev) => ({
      sync: {
        ...prev.sync,
        isSyncing: true,
        lastSyncError: null,
      },
    }));

    try {
      // Reset local database (preserving organizations)
      console.log("[resetAndSync] Resetting local database...");
      await resetLocalDatabaseExceptOrganizations();

      // Small delay to ensure database is fully reset before syncing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clear last sync time so we pull all data
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.removeItem(LAST_SYNC_KEY);

      set((prev) => ({
        sync: {
          ...prev.sync,
          lastSyncTime: null,
        },
      }));

      // Check event_participants BEFORE sync
      const { database: db1 } = require("@/database");
      const participantsBeforeSync = await db1.get("event_participants").query().fetchCount();
      console.log(`[resetAndSync] Event participants BEFORE sync: ${participantsBeforeSync}`);

      // Sync fresh data from server (skip organizations since they're preserved locally)
      console.log("[resetAndSync] Syncing fresh data from server...");
      const result = await sync({ skipOrganizations: true });

      if (result.success) {
        await AsyncStorage.setItem(LAST_SYNC_KEY, result.timestamp.toString());

        // Debug: Check actual data in database
        const { database } = require("@/database");
        const { Q } = require("@nozbe/watermelondb");

        const schoolCount = await database.get("schools").query().fetchCount();
        console.log("[resetAndSync] Schools in database after sync:", schoolCount);

        // Check school_members
        const memberCount = await database.get("school_members").query().fetchCount();
        console.log("[resetAndSync] School members in database:", memberCount);

        // Check event_participants AFTER sync
        const participantsAfterSync = await database.get("event_participants").query().fetchCount();
        console.log(`[resetAndSync] Event participants AFTER sync: ${participantsAfterSync}`);

        // Log all event_participants to see duplicates
        const allParticipants = await database.get("event_participants").query().fetch();
        console.log(`[resetAndSync] All event_participants in database:`);
        for (const p of allParticipants) {
          console.log(`[resetAndSync] - Participant: id=${p.id}, event_id=${p.eventId}, member_id=${p.schoolMemberId}, status=${p.status}`);
        }

        // Check user's memberships
        const state = get();
        console.log(`[resetAndSync] Current user in state: ${state.user?.id || 'NONE'}`);

        if (state.user?.id) {
          const userMembers = await database.get("school_members")
            .query(
              Q.where("user_id", state.user.id),
              Q.where("deleted_at", null)
            )
            .fetch();
          console.log(`[resetAndSync] User ${state.user.id} has ${userMembers.length} membership(s)`);

          // Log each membership with memberId, schoolId
          for (const member of userMembers) {
            console.log(`[resetAndSync] - Member ID: ${member.id}, School ID: ${member.schoolId}, Status: ${member.status}`);
          }
        } else {
          console.warn('[resetAndSync] No user in state - cannot check user memberships');
        }

        // Also log ALL members to see what's in DB
        const allMembers = await database.get("school_members").query().fetch();
        console.log(`[resetAndSync] ALL members in database:`);
        for (const member of allMembers) {
          console.log(`[resetAndSync] - Member: id=${member.id}, user_id=${member.userId}, school_id=${member.schoolId}, status=${member.status}`);
        }

        set((prev) => ({
          sync: {
            ...prev.sync,
            isSyncing: false,
            lastSyncTime: result.timestamp,
            lastSyncError: null,
          },
        }));

        console.log("[resetAndSync] Reset and sync complete");
      } else {
        set((prev) => ({
          sync: {
            ...prev.sync,
            isSyncing: false,
            lastSyncError: result.error || "Unknown error",
          },
        }));
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      set((prev) => ({
        sync: {
          ...prev.sync,
          isSyncing: false,
          lastSyncError: errorMessage,
        },
      }));

      console.error("[resetAndSync] Error:", error);

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  },

  // Auth actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Helper
  isAuthenticatedFull: () => {
    const state = get();
    return !!state.user && !!state.session;
  },
}));
