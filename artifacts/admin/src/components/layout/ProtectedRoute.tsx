import { useAuthUser, useAdminProfile } from "@/lib/api";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuthUser();
  const { data: profile, isLoading: profileLoading } = useAdminProfile(user?.uid);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (!authLoading && user && !profileLoading && profile?.role !== 'admin') {
      setLocation("/login");
    }
  }, [user, authLoading, profile, profileLoading, setLocation]);

  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
