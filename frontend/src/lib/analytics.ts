// src/lib/analytics.ts
// Google Analytics 4 utility for tracking pageviews and events

import ReactGA from 'react-ga4';

/**
 * Initialize Google Analytics 4
 * Should be called once when the app starts
 */
export const initGA = (): void => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('⚠️ Google Analytics: Measurement ID not found in environment variables');
    console.warn('Add VITE_GA_MEASUREMENT_ID to your .env file to enable analytics');
    return;
  }

  // Only initialize in production or if explicitly enabled
  const isDevelopment = import.meta.env.DEV;
  const enableInDev = import.meta.env.VITE_GA_ENABLE_IN_DEV === 'true';

  if (isDevelopment && !enableInDev) {
    console.log('📊 Google Analytics: Disabled in development mode');
    console.log('Set VITE_GA_ENABLE_IN_DEV=true to enable in development');
    return;
  }

  try {
    ReactGA.initialize(measurementId, {
      gaOptions: {
        siteSpeedSampleRate: 100, // Track all page load times
      },
    });
    console.log('✅ Google Analytics initialized:', measurementId);
  } catch (error) {
    console.error('❌ Google Analytics initialization failed:', error);
  }
};

/**
 * Track a pageview
 * @param path - The page path (e.g., '/product/123')
 * @param title - Optional page title
 */
export const trackPageView = (path: string, title?: string): void => {
  try {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
    console.log('📊 GA Pageview:', path);
  } catch (error) {
    console.error('❌ GA Pageview tracking failed:', error);
  }
};

/**
 * Track custom events
 * @param category - Event category (e.g., 'User', 'Product')
 * @param action - Event action (e.g., 'Login', 'Add to Cart')
 * @param label - Optional event label
 * @param value - Optional numeric value
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
    console.log('📊 GA Event:', { category, action, label, value });
  } catch (error) {
    console.error('❌ GA Event tracking failed:', error);
  }
};

/**
 * Track conversions/goals
 * @param name - Conversion name (e.g., 'signup', 'purchase')
 * @param value - Optional conversion value
 */
export const trackConversion = (name: string, value?: number): void => {
  try {
    ReactGA.gtag('event', 'conversion', {
      send_to: import.meta.env.VITE_GA_MEASUREMENT_ID,
      value: value,
      event_label: name,
    });
    console.log('📊 GA Conversion:', name, value);
  } catch (error) {
    console.error('❌ GA Conversion tracking failed:', error);
  }
};

/**
 * Set user ID for tracking authenticated users
 * @param userId - Unique user identifier
 */
export const setUserId = (userId: string): void => {
  try {
    ReactGA.set({ userId });
    console.log('📊 GA User ID set:', userId);
  } catch (error) {
    console.error('❌ GA User ID failed:', error);
  }
};

/**
 * Set custom user properties
 * @param properties - Object with custom properties
 */
export const setUserProperties = (properties: Record<string, string>): void => {
  try {
    ReactGA.set(properties);
    console.log('📊 GA User Properties set:', properties);
  } catch (error) {
    console.error('❌ GA User Properties failed:', error);
  }
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackConversion,
  setUserId,
  setUserProperties,
};
