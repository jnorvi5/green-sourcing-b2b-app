// frontend/src/context/AuthContext.tsx
/**
 * Enhanced Auth Context with Role-Based Access Control
 * 
 * Provides:
 * - User authentication state
 * - User profile with role
 * - Login/logout functions
 * - Role checking utilities
 */

import { useEffect, useState, useContext, createContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// User roles enum
export type UserRole = 'buyer' | 'supplier' | 'admin';

// User profile from database
export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    jobTitle?: string;
    avatarUrl?: string;
    onboardingCompleted: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

// Auth context interface
interface AuthContextType {
    // State
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;

    // Role helpers
    role: UserRole | null;
    isSupplier: boolean;
    isBuyer: boolean;
    isAdmin: boolean;
    hasRole: (role: UserRole | UserRole[]) => boolean;

    // Actions
    login: (email: string, password: string) => Promise<{ error: Error | null }>;
    signup: (email: string, password: string, metadata?: SignupMetadata) => Promise<{ error: Error | null }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

interface SignupMetadata {
    role?: UserRole;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Try users table as fallback
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (userError) {
                    console.error('Error fetching profile:', error);
                    return null;
                }

                // Map from users table
                return {
                    id: userData.id,
                    email: userData.email,
                    role: (userData.role || 'buyer') as UserRole,
                    firstName: undefined,
                    lastName: undefined,
                    companyName: undefined,
                    jobTitle: undefined,
                    avatarUrl: undefined,
                    onboardingCompleted: false,
                    lastLoginAt: undefined,
                    createdAt: userData.created_at
                };
            }

            // Map database fields to camelCase
            const mappedProfile: UserProfile = {
                id: data.id,
                email: data.email,
                role: data.role as UserRole,
                firstName: data.first_name,
                lastName: data.last_name,
                companyName: data.company_name,
                jobTitle: data.job_title,
                avatarUrl: data.avatar_url,
                onboardingCompleted: data.onboarding_completed || false,
                lastLoginAt: data.last_login_at,
                createdAt: data.created_at
            };

            return mappedProfile;
        } catch (err) {
            console.error('Profile fetch error:', err);
            return null;
        }
    }, []);

    // Refresh profile
    const refreshProfile = useCallback(async () => {
        if (user) {
            const newProfile = await fetchProfile(user.id);
            setProfile(newProfile);
        }
    }, [user, fetchProfile]);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Get current session
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Fetch profile if user exists
                if (currentSession?.user) {
                    const userProfile = await fetchProfile(currentSession.user.id);
                    setProfile(userProfile);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, newSession: Session | null) => {
                console.log('[Auth] State changed:', event);

                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (newSession?.user) {
                    // Small delay to allow database trigger to complete
                    setTimeout(async () => {
                        const userProfile = await fetchProfile(newSession.user.id);
                        setProfile(userProfile);
                    }, 500);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // Login function
    const login = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return { error };
            }

            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    };

    // Signup function with role
    const signup = async (email: string, password: string, metadata?: SignupMetadata) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: metadata?.role || 'buyer',
                        first_name: metadata?.firstName,
                        last_name: metadata?.lastName,
                        company_name: metadata?.companyName
                    }
                }
            });

            if (error) {
                return { error };
            }

            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    };

    // Logout function
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    // Update profile
    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) {
            return { error: new Error('Not authenticated') };
        }

        try {
            // Map camelCase to snake_case for database
            const dbUpdates: Record<string, unknown> = {};
            if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
            if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
            if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
            if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
            if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
            if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', user.id);

            if (error) {
                return { error };
            }

            // Refresh profile
            await refreshProfile();
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    };

    // Role helpers
    const role = profile?.role ?? null;
    const isSupplier = role === 'supplier';
    const isBuyer = role === 'buyer';
    const isAdmin = role === 'admin';

    const hasRole = (requiredRole: UserRole | UserRole[]) => {
        if (!role) return false;
        if (role === 'admin') return true; // Admin has all roles

        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(role);
        }
        return role === requiredRole;
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        role,
        isSupplier,
        isBuyer,
        isAdmin,
        hasRole,
        login,
        signup,
        logout,
        refreshProfile,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Re-export types
export type { User, Session } from '@supabase/supabase-js';
