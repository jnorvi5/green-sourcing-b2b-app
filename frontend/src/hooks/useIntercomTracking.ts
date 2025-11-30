/**
 * Intercom Analytics Hooks
 *
 * Track key user events for customer success and support optimization
 */

import { useCallback } from 'react';
import { useIntercom } from '../context/IntercomProvider';

/**
 * Combined hook that exports all tracking functionality
 */
export function useIntercomTracking() {
    const { trackEvent, update } = useIntercom();

    return {
        trackEvent,
        update,
    };
}

/**
 * Hook for tracking product-related events
 */
export function useProductTracking() {
    const { trackEvent } = useIntercom();

    const trackProductView = useCallback((productId: string, productName: string, category: string) => {
        trackEvent('product_viewed', {
            product_id: productId,
            product_name: productName,
            category: category,
        });
    }, [trackEvent]);

    const trackAddToProject = useCallback((productId: string, productName: string) => {
        trackEvent('product_saved_to_project', {
            product_id: productId,
            product_name: productName,
        });
    }, [trackEvent]);

    const trackProductSearch = useCallback((query: string, resultsCount: number) => {
        trackEvent('product_search', {
            search_query: query,
            results_count: resultsCount,
        });
    }, [trackEvent]);

    return {
        trackProductView,
        trackAddToProject,
        trackProductSearch,
    };
}

/**
 * Hook for tracking RFQ-related events
 */
export function useRFQTracking() {
    const { trackEvent } = useIntercom();

    const trackRFQStarted = useCallback((productId: string, productName: string, supplierId: string) => {
        trackEvent('rfq_started', {
            product_id: productId,
            product_name: productName,
            supplier_id: supplierId,
        });
    }, [trackEvent]);

    const trackRFQSubmitted = useCallback((rfqId: string, productName: string, quantity: number) => {
        trackEvent('rfq_submitted', {
            rfq_id: rfqId,
            product_name: productName,
            quantity: quantity,
        });
    }, [trackEvent]);

    const trackRFQResponded = useCallback((rfqId: string, quotedPrice?: number) => {
        trackEvent('rfq_responded', {
            rfq_id: rfqId,
            quoted_price: quotedPrice,
        });
    }, [trackEvent]);

    const trackRFQAccepted = useCallback((rfqId: string, quotedPrice?: number) => {
        trackEvent('rfq_accepted', {
            rfq_id: rfqId,
            quoted_price: quotedPrice,
        });
    }, [trackEvent]);

    return {
        trackRFQStarted,
        trackRFQSubmitted,
        trackRFQResponded,
        trackRFQAccepted,
    };
}

/**
 * Hook for tracking supplier events
 */
export function useSupplierTracking() {
    const { trackEvent } = useIntercom();

    const trackSupplierProfileView = useCallback((supplierId: string, supplierName: string) => {
        trackEvent('supplier_profile_viewed', {
            supplier_id: supplierId,
            supplier_name: supplierName,
        });
    }, [trackEvent]);

    const trackProductListed = useCallback((productId: string, productName: string, price: number) => {
        trackEvent('product_listed', {
            product_id: productId,
            product_name: productName,
            price: price,
        });
    }, [trackEvent]);

    const trackProductUpdated = useCallback((productId: string) => {
        trackEvent('product_updated', {
            product_id: productId,
        });
    }, [trackEvent]);

    return {
        trackSupplierProfileView,
        trackProductListed,
        trackProductUpdated,
    };
}

/**
 * Hook for tracking onboarding and engagement events
 */
export function useEngagementTracking() {
    const { trackEvent, update } = useIntercom();

    const trackSignupCompleted = useCallback((userType: 'buyer' | 'supplier') => {
        trackEvent('signup_completed', {
            user_type: userType,
        });
        update({ user_type: userType });
    }, [trackEvent, update]);

    const trackProfileCompleted = useCallback((completionPercent: number) => {
        trackEvent('profile_completed', {
            completion_percent: completionPercent,
        });
    }, [trackEvent]);

    const trackFeatureUsed = useCallback((featureName: string) => {
        trackEvent('feature_used', {
            feature_name: featureName,
        });
    }, [trackEvent]);

    const trackHelpRequested = useCallback((topic: string, page: string) => {
        trackEvent('help_requested', {
            topic: topic,
            page: page,
        });
    }, [trackEvent]);

    return {
        trackSignupCompleted,
        trackProfileCompleted,
        trackFeatureUsed,
        trackHelpRequested,
    };
}
