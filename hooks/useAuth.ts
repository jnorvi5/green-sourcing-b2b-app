'use client';

import { useEffect, useState } from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return {
        user,
        session,
        loading,
        signOut,
        isAuthenticated: !!user,
    };
}
