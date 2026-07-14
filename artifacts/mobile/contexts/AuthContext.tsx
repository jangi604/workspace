import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthUser, useMyProfile } from '@/lib/api';
import type { UserProfile } from '@/lib/api';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  profile: (UserProfile & { uid: string }) | null | undefined;
  profileLoading: boolean;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  profileLoading: false,
  authLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuthUser();
  const profileQuery = useMyProfile(user?.uid);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: profileQuery.data,
        profileLoading: profileQuery.isLoading,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
