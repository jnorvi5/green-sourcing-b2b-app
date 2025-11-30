/**
 * Intercom React Provider
 *
 * Automatically initializes Intercom and updates user data when auth changes
 */

import { createContext, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
    loadIntercom,
    bootIntercom,
    updateIntercom,
    shutdownIntercom,
    showIntercom,
    hideIntercom,
    showIntercomWithMessage,
    trackIntercomEvent,
} from '../lib/intercom';
import type { IntercomUserData } from '../lib/intercom';
import { useAuth } from './AuthContext';

interface IntercomContextType {
    show: () => void;
    hide: () => void;
    showWithMessage: (message: string) => void;
    trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
    update: (data: Partial<IntercomUserData>) => void;
}

const IntercomContext = createContext<IntercomContextType | null>(null);

interface IntercomProviderProps {
    children: ReactNode;
}

export function IntercomProvider({ children }: IntercomProviderProps) {
    const { user } = useAuth();

    // Initialize Intercom on mount
    useEffect(() => {
        loadIntercom();

        // Boot with anonymous user initially
        bootIntercom();
    }, []);

    // Update Intercom when user auth changes
    useEffect(() => {
        if (user) {
            // User is logged in - update with their data
            const userMetadata = user.user_metadata || {};
            updateIntercom({
                user_id: user.id,
                email: user.email,
                name: userMetadata.full_name || userMetadata.company_name || user.email,
                user_type: userMetadata.role as 'buyer' | 'supplier' | 'admin',
                signup_date: user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : undefined,
                company: userMetadata.company_name ? {
                    company_id: user.id,
                    name: userMetadata.company_name,
                } : undefined,
            });
        } else {
            // User logged out - shutdown and reboot as anonymous
            shutdownIntercom();
            bootIntercom();
        }
    }, [user]);
    const hide = useCallback(() => {
        hideIntercom();
    }, []);

    const showWithMessage = useCallback((message: string) => {
        showIntercomWithMessage(message);
    }, []);

    const trackEvent = useCallback((eventName: string, metadata?: Record<string, unknown>) => {
        trackIntercomEvent(eventName, metadata);
    }, []);

    const update = useCallback((data: Partial<IntercomUserData>) => {
        updateIntercom(data);
    }, []);

    const value: IntercomContextType = {
        show,
        hide,
        showWithMessage,
        trackEvent,
        update,
    };

    return (
        <IntercomContext.Provider value={value}>
            {children}
        </IntercomContext.Provider>
    );
}

/**
 * Hook to access Intercom functionality
 */
export function useIntercom(): IntercomContextType {
    const context = useContext(IntercomContext);

    if (!context) {
        // Return no-op functions if not in provider (graceful fallback)
        return {
            show: () => { },
            hide: () => { },
            showWithMessage: () => { },
            trackEvent: () => { },
            update: () => { },
        };
    }

    return context;
}
