"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Custom auth hook using NextAuth
 * Provides a consistent interface for authentication across the app
 */
export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ? {
    id: session.user.id as string,
    email: session.user.email || "",
    role: (session.user as any).role || "user",
    name: session.user.name || "",
  } : null;

  const login = async (provider: string) => {
    await signIn(provider);
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return {
    user,
    loading: status === "loading",
    login,
    logout,
  };
};
