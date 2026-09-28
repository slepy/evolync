import { supabase } from '@/config/supabase';
import { useStore, type AuthError, type LoginCredentials } from '@/store';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';
import {
  safeStorageDelete,
  safeStorageGet,
  safeStorageSet,
} from '../services/secureStorage';

// Safe network check that handles NetInfo errors gracefully
const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const NetInfo = require('@react-native-community/netinfo').default;
    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  } catch (error) {
    console.warn('NetInfo error, assuming connected:', error);
    return true; // Assume connected if NetInfo fails
  }
};

// ============================================================================
// Helpers
// ============================================================================

const mapSupabaseError = (error: SupabaseAuthError | Error): AuthError => {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return {
      code: 'invalid_credentials',
      message: t('errorInvalidCredentialsMessage'),
      recoverable: true,
    };
  }

  if (message.includes('too many requests')) {
    return {
      code: 'too_many_requests',
      message: t('errorTooManyRequestsMessage'),
      recoverable: false,
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      code: 'network_error',
      message: t('errorNetworkErrorMessage'),
      recoverable: true,
    };
  }

  return {
    code: 'unknown',
    message: t('errorUnknownMessage'),
    recoverable: true,
  };
};

// ============================================================================
// useAuth Hook
// ============================================================================

export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    session,
    isLoading,
    error,
    setUser,
    setSession,
    setLoading,
    setError,
    clearError,
    isAuthenticatedFull,
    setOrganization,
    setSchoolMemberships,
    setActiveMembershipId,
    performSync,
  } = useStore();

  // Helper to sync organization state (for organization owners)
  const syncOrganization = useCallback(async (userId: string) => {
    try {
      // 1. Try to load from cache first
      const cachedOrgStr = await safeStorageGet('organization');
      if (cachedOrgStr) {
        try {
          const parsed = JSON.parse(cachedOrgStr);
          if (parsed.owner_id === userId) {
            setOrganization(parsed);
          } else {
            await safeStorageDelete('organization');
          }
        } catch {
          await safeStorageDelete('organization');
        }
      }

      // 2. If online, update from server
      const isConnected = await checkNetworkConnection();
      if (isConnected) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, owner_id, name')
          .eq('owner_id', userId)
          .single();

        if (org) {
          const orgData = { id: org.id, owner_id: org.owner_id, name: org.name };
          setOrganization(orgData);
          await safeStorageSet('organization', JSON.stringify(orgData));
        } else {
          // User is not an owner (or no longer an owner)
          setOrganization(null);
          await safeStorageDelete('organization');
        }
      }
    } catch (error) {
      console.warn('Error syncing organization:', error);
    }
  }, [setOrganization]);

  // Helper to sync school memberships state (for non-organization owners)
  const syncSchoolMembership = useCallback(async (userId: string) => {
    const CACHE_KEY = 'schoolMemberships';
    try {
      // 1. Load from cache first (offline-first)
      const cachedStr = await safeStorageGet(CACHE_KEY);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchoolMemberships(parsed);
            // Restore last active membership id if stored
            const activeId = await safeStorageGet('activeMembershipId');
            const validActive = parsed.find((m: { memberId: string }) => m.memberId === activeId);
            setActiveMembershipId(validActive ? activeId : parsed[0].memberId);
          }
        } catch {
          await safeStorageDelete(CACHE_KEY);
        }
      }

      // 3. If online, refresh from server
      const isConnected = await checkNetworkConnection();
      if (isConnected) {
        const { data } = await supabase
          .from('school_members')
          .select('id, school_id, schools!inner(id, organization_id)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .is('deleted_at', null);

        if (data && data.length > 0) {
          const memberships = data.map((row: any) => ({
            memberId: row.id,
            schoolId: row.school_id,
            organizationId: row.schools.organization_id,
          }));
          setSchoolMemberships(memberships);
          await safeStorageSet(CACHE_KEY, JSON.stringify(memberships));

          // Keep current active if still valid, otherwise pick first
          const activeId = await safeStorageGet('activeMembershipId');
          const stillValid = memberships.find((m) => m.memberId === activeId);
          const nextActive = stillValid ? activeId : memberships[0].memberId;
          setActiveMembershipId(nextActive);
          await safeStorageSet('activeMembershipId', nextActive!);
        } else {
          setSchoolMemberships([]);
          setActiveMembershipId(null);
          await safeStorageDelete(CACHE_KEY);
          await safeStorageDelete('activeMembershipId');
        }
      }
    } catch (error) {
      console.warn('Error syncing school memberships:', error);
    }
  }, [setSchoolMemberships, setActiveMembershipId]);

  // ==========================================================================
  // Sign In with Email/Password
  // ==========================================================================

  const signInWithEmail = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      clearError();

      // Check network connectivity
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setError({
          code: 'network_error',
          message: t('errorNoInternetMessage'),
          recoverable: true,
        });
        return;
      }

      // Call Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        setError(mapSupabaseError(authError));
        return;
      }

      if (!data.session || !data.user) {
        setError({
          code: 'unknown',
          message: t('errorLoginFailedMessage'),
          recoverable: true,
        });
        return;
      }

      // Save session to storage
      await safeStorageSet('session', JSON.stringify(data.session));

      // Update global state
      setUser(data.user);
      setSession(data.session);

      // Sync organization data and school membership before navigation
      await syncOrganization(data.user.id);
      await syncSchoolMembership(data.user.id);

      // Sync data from server
      performSync(true).catch((err: unknown) => {
        console.error("[signInWithEmail] performSync failed:", err);
      });

      // Navigate to main screen
      router.replace('/');
    } catch (error) {
      console.error('signInWithEmail error:', error);
      setError(mapSupabaseError(error as Error));
    } finally {
      setLoading(false);
    }
  }, [router, setUser, setSession, setLoading, setError, clearError]);

  // ==========================================================================
  // Sign In with Google OAuth
  // ==========================================================================

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      // Check network connectivity
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setError({
          code: 'network_error',
          message: t('errorGoogleRequiresInternetMessage'),
          recoverable: true,
        });
        return;
      }

      // Initiate OAuth flow
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'evolync://auth/callback',
        },
      });

      if (oauthError) {
        setError(mapSupabaseError(oauthError));
        return;
      }

      // Open OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'evolync://auth/callback'
      );

      // Handle user cancellation
      if (result.type === 'cancel' || result.type === 'dismiss') {
        // User cancelled - not an error
        console.log('OAuth cancelled by user');
        return;
      }

      // OAuth success is handled in callback screen
    } catch (error) {
      console.error('signInWithGoogle error:', error);
      setError(mapSupabaseError(error as Error));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearError]);

  // ==========================================================================
  // Check Session (Auto-login)
  // ==========================================================================

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);

      // Get session from storage
      const sessionString = await safeStorageGet('session');

      if (!sessionString) {
        setLoading(false);
        return;
      }

      const storedSession = JSON.parse(sessionString);

      // Check if token expired
      const now = Math.floor(Date.now() / 1000);
      if (storedSession.expires_at && storedSession.expires_at < now) {
        const isConnected = await checkNetworkConnection();

        if (!isConnected) {
          // Offline with an expired token: keep using the cached session for
          // local (WatermelonDB) access instead of logging the user out.
          // Supabase's own refresh/verification resumes once back online.
          setUser(storedSession.user);
          setSession(storedSession);

          await syncOrganization(storedSession.user.id);
          await syncSchoolMembership(storedSession.user.id);

          router.replace('/');
          setLoading(false);
          return;
        }

        // Try to refresh token
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: storedSession.refresh_token,
        });

        if (error || !data.session) {
          // Refresh failed - clear session
          await safeStorageDelete('session');
          setError({
            code: 'session_expired',
            message: t('errorSessionExpiredMessage'),
            recoverable: true,
          });
          setLoading(false);
          return;
        }

        // Save refreshed session
        await safeStorageSet('session', JSON.stringify(data.session));
        setUser(data.session.user);
        setSession(data.session);

        // Sync organization data and school membership
        await syncOrganization(data.session.user.id);
        await syncSchoolMembership(data.session.user.id);

        // Sync data from server (without reset)
        performSync(true).catch((err: unknown) => {
          console.error("[checkSession] performSync failed:", err);
        });

        router.replace('/');
      } else {

        // Note: verify with Supabase requires network. If offline, getSession might return session from memory/storage depending on implementation,
        // but typically we should rely on storedSession if offline.
        
        let validSession = storedSession;

        const isConnected = await checkNetworkConnection();
        if (isConnected) {
           const { data, error } = await supabase.auth.getSession();
           if (error || !data.session) {
             await safeStorageDelete('session');
             await safeStorageDelete('organization');
             await safeStorageDelete('schoolMemberships');
             await safeStorageDelete('activeMembershipId');
             setLoading(false);
             return;
           }
           validSession = data.session;
        }

        // Session valid - auto login
        setUser(validSession.user);
        setSession(validSession);

        // Sync organization data and school membership
        await syncOrganization(validSession.user.id);
        await syncSchoolMembership(validSession.user.id);

        // Sync data from server (without reset)
        performSync(true).catch((err: unknown) => {
          console.error("[checkSession] performSync failed:", err);
        });

        router.replace('/');
      }
    } catch (error) {
      console.error('checkSession error:', error);
      await safeStorageDelete('session');
      await safeStorageDelete('organization');
    } finally {
      setLoading(false);
    }
  }, [setUser, setSession, setLoading, setError, router, syncOrganization]);

  // ==========================================================================
  // Sign Out
  // ==========================================================================

  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear storage
      await safeStorageDelete('session');
      await safeStorageDelete('organization');
      await safeStorageDelete('schoolMemberships');
      await safeStorageDelete('activeMembershipId');

      // Clear state
      setUser(null);
      setSession(null);
      setOrganization(null);
      setSchoolMemberships([]);
      setActiveMembershipId(null);
      clearError();

      // Navigate to login
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('signOut error:', error);
    } finally {
      setLoading(false);
    }
  }, [setUser, setSession, setOrganization, setSchoolMemberships, setActiveMembershipId, setLoading, clearError, router]);

  // ==========================================================================
  // Setup auth state listener
  // ==========================================================================

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setSession(session);
        await safeStorageSet('session', JSON.stringify(session));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        await safeStorageDelete('session');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
        await safeStorageSet('session', JSON.stringify(session));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setSession]);

  // ==========================================================================
  // Return hook interface
  // ==========================================================================

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated: isAuthenticatedFull(),
    signInWithEmail,
    signInWithGoogle,
    signOut,
    checkSession,
    clearError,
  };
};
