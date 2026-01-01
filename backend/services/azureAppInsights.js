/**
 * Azure Application Insights Service
 * Performance monitoring and telemetry
 * 
 * Resources:
 * - greenchainz-platform (rg-greenchainz)
 * - greenchainz-scraper (greenchainzscraper)
 */

const appInsights = require('applicationinsights');
const { azureConfig } = require('../config/azure');

class AzureAppInsightsService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.config = azureConfig.appInsights;
  }

  /**
   * Initialize Application Insights
   */
  init() {
    if (!this.config.enabled) {
      console.log('[AppInsights] Application Insights is disabled');
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // Setup Application Insights
      if (this.config.connectionString) {
        appInsights.setup(this.config.connectionString);
      } else if (this.config.instrumentationKey) {
        appInsights.setup(this.config.instrumentationKey);
      } else {
        console.log('[AppInsights] No connection string or instrumentation key provided');
        return false;
      }

      // Configure
      appInsights
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

      // Start
      appInsights.start();

      this.client = appInsights.defaultClient;
      this.isInitialized = true;

      console.log('[AppInsights] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[AppInsights] Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Track custom event
   */
  trackEvent(name, properties = {}, measurements = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackEvent({
        name,
        properties,
        measurements
      });
    } catch (error) {
      console.error(`[AppInsights] Error tracking event ${name}:`, error.message);
    }
  }

  /**
   * Track custom metric
   */
  trackMetric(name, value, properties = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackMetric({
        name,
        value,
        properties
      });
    } catch (error) {
      console.error(`[AppInsights] Error tracking metric ${name}:`, error.message);
    }
  }

  /**
   * Track exception
   */
  trackException(exception, properties = {}) {
    if (!this.isInitialized) {
      console.error('[AppInsights] Exception:', exception);
      return;
    }

    try {
      this.client.trackException({
        exception,
        properties
      });
    } catch (error) {
      console.error('[AppInsights] Error tracking exception:', error.message);
    }
  }

  /**
   * Track request
   */
  trackRequest(req, res, properties = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackRequest({
        name: `${req.method} ${req.path}`,
        url: req.url,
        duration: res.duration || 0,
        resultCode: res.statusCode,
        success: res.statusCode < 400,
        properties: {
          ...properties,
          method: req.method,
          path: req.path,
          userAgent: req.get('user-agent')
        }
      });
    } catch (error) {
      console.error('[AppInsights] Error tracking request:', error.message);
    }
  }

  /**
   * Track dependency (external API calls)
   */
  trackDependency(name, commandName, duration, success, properties = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackDependency({
        name,
        commandName,
        duration,
        success,
        resultCode: success ? 200 : 500,
        dependencyTypeName: 'HTTP',
        properties
      });
    } catch (error) {
      console.error(`[AppInsights] Error tracking dependency ${name}:`, error.message);
    }
  }

  /**
   * Track page view
   */
  trackPageView(name, url, properties = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackPageView({
        name,
        url,
        properties
      });
    } catch (error) {
      console.error(`[AppInsights] Error tracking page view ${name}:`, error.message);
    }
  }

  /**
   * Track trace/log
   */
  trackTrace(message, severity = 1, properties = {}) {
    if (!this.isInitialized) return;

    try {
      this.client.trackTrace({
        message,
        severity, // 0=Verbose, 1=Info, 2=Warning, 3=Error, 4=Critical
        properties
      });
    } catch (error) {
      console.error('[AppInsights] Error tracking trace:', error.message);
    }
  }

  /**
   * Flush telemetry
   */
  flush() {
    if (!this.isInitialized) return;

    return new Promise((resolve) => {
      this.client.flush({
        callback: () => resolve()
      });
    });
  }

  /**
   * Express middleware for automatic request tracking
   */
  getMiddleware() {
    return (req, res, next) => {
      if (!this.isInitialized) {
        return next();
      }

      const startTime = Date.now();

      // Track when response finishes
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        res.duration = duration;
        
        this.trackRequest(req, res, {
          userId: req.user?.id,
          sessionId: req.sessionID
        });
      });

      next();
    };
  }

  /**
   * Business metrics tracking
   */
  trackUserRegistration(userId, properties = {}) {
    this.trackEvent('UserRegistration', { userId, ...properties });
  }

  trackRFQCreated(rfqId, properties = {}) {
    this.trackEvent('RFQCreated', { rfqId, ...properties });
  }

  trackProductSearch(query, results, properties = {}) {
    this.trackEvent('ProductSearch', { query, resultCount: results, ...properties });
  }

  trackCertificationVerified(certId, provider, properties = {}) {
    this.trackEvent('CertificationVerified', { certId, provider, ...properties });
  }

  trackAPICall(endpoint, duration, success, properties = {}) {
    this.trackDependency('ExternalAPI', endpoint, duration, success, properties);
  }
}

// Export singleton instance
const appInsightsService = new AzureAppInsightsService();

module.exports = {
  appInsightsService,
  AzureAppInsightsService
};
