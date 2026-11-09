"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import {
  reloadUser as reloadFirebaseUser,
  fetchUserProfile,
  subscribeToAuthState,
  subscribeToIdTokenChanges,
} from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";

const VERIFICATION_POLL_INTERVAL_MS = 5_000;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  reloadUser: () => Promise<User | null>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  emailVerified: false,
  profile: null,
  profileLoading: false,
  reloadUser: async () => null,
  refreshProfile: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToIdTokenChanges((nextUser) => {
      setUser(nextUser);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const current = userRef.current;
    if (!current) {
      setProfile(null);
      return null;
    }
    setProfileLoading(true);
    try {
      const loaded = await fetchUserProfile(current);
      setProfile(loaded);
      return loaded;
    } catch (error) {
      console.error("Failed to load user profile", error);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    const currentUser = user;

    async function loadProfile() {
      try {
        const loaded = await fetchUserProfile(currentUser);
        if (!cancelled) {
          setProfile(loaded);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const reloadUser = useCallback(async (): Promise<User | null> => {
    const current = userRef.current;
    if (!current) {
      return null;
    }
    const refreshed = await reloadFirebaseUser(current);
    setUser(refreshed);
    return refreshed;
  }, []);

  const emailVerified = user?.emailVerified ?? false;

  useEffect(() => {
    if (!user || emailVerified) {
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const refreshed = await reloadFirebaseUser(user);
        if (!cancelled && refreshed.emailVerified) {
          setUser(refreshed);
        }
      } catch (error) {
        console.error("Failed to refresh verification state", error);
      }
    };

    const timer = window.setInterval(check, VERIFICATION_POLL_INTERVAL_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user, emailVerified]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      emailVerified,
      profile,
      profileLoading,
      reloadUser,
      refreshProfile,
    }),
    [user, loading, emailVerified, profile, profileLoading, reloadUser, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
