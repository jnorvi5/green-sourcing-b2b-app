-- Analytics Engine for Data Licensing
-- Tracks architect search/filter behavior (anonymized & aggregated)
-- Created: 2025-12-02

-- ============================================
-- SEARCH ANALYTICS
-- ============================================

-- Search Events (Anonymized)
CREATE TABLE IF NOT EXISTS Search_Events (
  SearchID BIGSERIAL PRIMARY KEY,
  SessionID VARCHAR(64) NOT NULL, -- Anonymized session hash
  SearchQuery VARCHAR(500) NOT NULL,
  MaterialType VARCHAR(100), -- Categorized: insulation, flooring, cladding, etc.
  ResultCount INTEGER DEFAULT 0,
  SearchTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  GeographicRegion VARCHAR(100), -- State/City (anonymized from IP)
  DeviceType VARCHAR(50), -- desktop, mobile, tablet
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search Keywords (Aggregated)
CREATE TABLE IF NOT EXISTS Search_Keywords_Aggregated (
  KeywordID BIGSERIAL PRIMARY KEY,
  Keyword VARCHAR(255) NOT NULL UNIQUE,
  SearchCount INTEGER DEFAULT 0,
  LastSearched TIMESTAMP,
  MaterialTypeCategory VARCHAR(100),
  TrendDirection VARCHAR(20) CHECK (TrendDirection IN ('rising', 'stable', 'declining')),
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FILTER ANALYTICS
-- ============================================

-- Filter Events (Anonymized)
CREATE TABLE IF NOT EXISTS Filter_Events (
  FilterID BIGSERIAL PRIMARY KEY,
  SessionID VARCHAR(64) NOT NULL,
  FilterType VARCHAR(100) NOT NULL, -- carbon_footprint, certification, price, etc.
  FilterValue VARCHAR(255) NOT NULL, -- The actual filter value applied
  ResultCount INTEGER DEFAULT 0,
  FilterTimestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  GeographicRegion VARCHAR(100),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Carbon Footprint Thresholds (Aggregated)
CREATE TABLE IF NOT EXISTS Carbon_Threshold_Preferences (
  ThresholdID BIGSERIAL PRIMARY KEY,
  ThresholdRange VARCHAR(100) NOT NULL UNIQUE, -- e.g., "<15 kg CO2e", "15-30 kg CO2e"
  UsageCount INTEGER DEFAULT 0,
  MaterialTypeCategory VARCHAR(100),
  GeographicRegion VARCHAR(100),
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certification Preferences (Aggregated)
CREATE TABLE IF NOT EXISTS Certification_Preferences (
  PreferenceID BIGSERIAL PRIMARY KEY,
  CertificationName VARCHAR(255) NOT NULL,
  FilterCount INTEGER DEFAULT 0,
  RFQConversionRate DECIMAL(5, 4), -- Percentage of searches leading to RFQ
  AverageOrderValue DECIMAL(10, 2),
  GeographicRegion VARCHAR(100),
  MaterialTypeCategory VARCHAR(100),
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cert_pref_unique UNIQUE (CertificationName, GeographicRegion, MaterialTypeCategory)
);

-- Price Range Preferences (Aggregated)
CREATE TABLE IF NOT EXISTS Price_Range_Preferences (
  PriceRangeID BIGSERIAL PRIMARY KEY,
  MinPrice DECIMAL(10, 2),
  MaxPrice DECIMAL(10, 2),
  UsageCount INTEGER DEFAULT 0,
  MaterialTypeCategory VARCHAR(100),
  GeographicRegion VARCHAR(100),
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT price_range_unique UNIQUE (MinPrice, MaxPrice, MaterialTypeCategory, GeographicRegion)
);

-- ============================================
-- RFQ ANALYTICS
-- ============================================

-- RFQ Analytics (Aggregated from RFQ events)
CREATE TABLE IF NOT EXISTS RFQ_Analytics (
  AnalyticsID BIGSERIAL PRIMARY KEY,
  MaterialTypeCategory VARCHAR(100) NOT NULL,
  RFQCount INTEGER DEFAULT 0,
  ConversionRate DECIMAL(5, 4), -- RFQ to order conversion
  AverageTimeToClose INTEGER, -- In hours
  AverageOrderValue DECIMAL(10, 2),
  GeographicRegion VARCHAR(100),
  TimePeriod DATE NOT NULL, -- Date for daily aggregation
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rfq_analytics_unique UNIQUE (MaterialTypeCategory, GeographicRegion, TimePeriod)
);

-- Certification RFQ Performance
CREATE TABLE IF NOT EXISTS Certification_RFQ_Performance (
  PerformanceID BIGSERIAL PRIMARY KEY,
  CertificationName VARCHAR(255) NOT NULL,
  RFQCount INTEGER DEFAULT 0,
  WinRate DECIMAL(5, 4), -- Percentage of RFQs won
  AverageTimeToClose INTEGER, -- In hours
  AverageQuoteValue DECIMAL(10, 2),
  PremiumPercentage DECIMAL(5, 2), -- Price premium compared to non-certified
  TimePeriod DATE NOT NULL,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cert_rfq_perf_unique UNIQUE (CertificationName, TimePeriod)
);

-- ============================================
-- GEOGRAPHIC ANALYTICS
-- ============================================

-- Geographic Demand (Aggregated)
CREATE TABLE IF NOT EXISTS Geographic_Demand (
  DemandID BIGSERIAL PRIMARY KEY,
  Region VARCHAR(100) NOT NULL, -- State or City
  MaterialTypeCategory VARCHAR(100),
  SearchVolume INTEGER DEFAULT 0,
  RFQVolume INTEGER DEFAULT 0,
  SupplierCount INTEGER DEFAULT 0, -- Suppliers serving this region
  DemandSupplyGap DECIMAL(5, 2), -- Ratio indicating market opportunity
  TimePeriod DATE NOT NULL,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT geo_demand_unique UNIQUE (Region, MaterialTypeCategory, TimePeriod)
);

-- ============================================
-- SUPPLIER PERFORMANCE ANALYTICS
-- ============================================

-- Supplier Performance Metrics (Aggregated)
CREATE TABLE IF NOT EXISTS Supplier_Performance_Analytics (
  MetricID BIGSERIAL PRIMARY KEY,
  SupplierID BIGINT REFERENCES Suppliers(SupplierID) ON DELETE CASCADE,
  TotalRFQsReceived INTEGER DEFAULT 0,
  TotalRFQsWon INTEGER DEFAULT 0,
  WinRate DECIMAL(5, 4),
  AverageResponseTime INTEGER, -- In hours
  AverageTimeToClose INTEGER, -- In hours
  TotalRevenue DECIMAL(12, 2),
  AverageOrderValue DECIMAL(10, 2),
  CustomerSatisfactionScore DECIMAL(3, 2),
  TimePeriod DATE NOT NULL,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT supplier_perf_unique UNIQUE (SupplierID, TimePeriod)
);

-- Certification Win Analysis
CREATE TABLE IF NOT EXISTS Certification_Win_Analysis (
  AnalysisID BIGSERIAL PRIMARY KEY,
  CertificationName VARCHAR(255) NOT NULL,
  TotalRFQsWithCert INTEGER DEFAULT 0,
  TotalWinsWithCert INTEGER DEFAULT 0,
  WinRate DECIMAL(5, 4),
  AveragePremium DECIMAL(5, 2), -- Price premium percentage
  AverageTimeToClose INTEGER,
  MaterialTypeCategory VARCHAR(100),
  TimePeriod DATE NOT NULL,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cert_win_unique UNIQUE (CertificationName, MaterialTypeCategory, TimePeriod)
);

-- ============================================
-- DATA LICENSING REPORTS
-- ============================================

-- Data License Reports (Pre-generated for licensing customers)
CREATE TABLE IF NOT EXISTS Data_License_Reports (
  ReportID BIGSERIAL PRIMARY KEY,
  ReportType VARCHAR(100) NOT NULL CHECK (ReportType IN (
    'MarketTrends', 'CertificationDemand', 'GeographicAnalysis', 
    'PricingSensitivity', 'MaterialDemand', 'SupplierBenchmark'
  )),
  ReportTitle VARCHAR(255) NOT NULL,
  ReportData JSONB NOT NULL, -- Aggregated, anonymized data
  DateRangeStart DATE NOT NULL,
  DateRangeEnd DATE NOT NULL,
  MaterialTypeCategory VARCHAR(100),
  GeographicScope VARCHAR(100), -- 'National', 'Regional', specific region
  GeneratedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ExpiresAt TIMESTAMP, -- When report data becomes stale
  IsPublic BOOLEAN DEFAULT FALSE, -- For sample/teaser reports
  LicenseeTier VARCHAR(50) CHECK (LicenseeTier IN ('Basic', 'Professional', 'Enterprise'))
);

-- Data License Customers
CREATE TABLE IF NOT EXISTS Data_License_Customers (
  CustomerID BIGSERIAL PRIMARY KEY,
  CompanyName VARCHAR(255) NOT NULL,
  ContactEmail VARCHAR(255) NOT NULL,
  ContactName VARCHAR(255),
  LicenseTier VARCHAR(50) NOT NULL CHECK (LicenseTier IN ('Basic', 'Professional', 'Enterprise')),
  LicenseStartDate DATE NOT NULL,
  LicenseEndDate DATE,
  MonthlyFee DECIMAL(10, 2),
  AllowedReportTypes TEXT[], -- Array of allowed report types
  APIAccessEnabled BOOLEAN DEFAULT FALSE,
  APIKey VARCHAR(255),
  Status VARCHAR(50) DEFAULT 'Active' CHECK (Status IN ('Active', 'Suspended', 'Expired', 'Trial')),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data License Access Log
CREATE TABLE IF NOT EXISTS Data_License_Access_Log (
  AccessID BIGSERIAL PRIMARY KEY,
  CustomerID BIGINT REFERENCES Data_License_Customers(CustomerID),
  ReportID BIGINT REFERENCES Data_License_Reports(ReportID),
  AccessType VARCHAR(50) CHECK (AccessType IN ('View', 'Download', 'API')),
  IPAddress VARCHAR(45),
  AccessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR ANALYTICS PERFORMANCE
-- ============================================

-- Search Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_search_events_timestamp ON Search_Events(SearchTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_session ON Search_Events(SessionID);
CREATE INDEX IF NOT EXISTS idx_search_events_material ON Search_Events(MaterialType, SearchTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_region ON Search_Events(GeographicRegion, SearchTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_keywords_count ON Search_Keywords_Aggregated(SearchCount DESC);

-- Filter Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_filter_events_timestamp ON Filter_Events(FilterTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_filter_events_type ON Filter_Events(FilterType, FilterTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_filter_events_region ON Filter_Events(GeographicRegion, FilterTimestamp DESC);
CREATE INDEX IF NOT EXISTS idx_carbon_threshold_count ON Carbon_Threshold_Preferences(UsageCount DESC);
CREATE INDEX IF NOT EXISTS idx_cert_pref_count ON Certification_Preferences(FilterCount DESC);

-- RFQ Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_rfq_analytics_period ON RFQ_Analytics(TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_analytics_material ON RFQ_Analytics(MaterialTypeCategory, TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_cert_rfq_perf_period ON Certification_RFQ_Performance(TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_cert_rfq_perf_cert ON Certification_RFQ_Performance(CertificationName, TimePeriod DESC);

-- Geographic Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_geo_demand_region ON Geographic_Demand(Region, TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_geo_demand_gap ON Geographic_Demand(DemandSupplyGap DESC);

-- Supplier Performance Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_perf_supplier ON Supplier_Performance_Analytics(SupplierID, TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_perf_winrate ON Supplier_Performance_Analytics(WinRate DESC);
CREATE INDEX IF NOT EXISTS idx_cert_win_cert ON Certification_Win_Analysis(CertificationName, TimePeriod DESC);
CREATE INDEX IF NOT EXISTS idx_cert_win_rate ON Certification_Win_Analysis(WinRate DESC);

-- Data License Indexes
CREATE INDEX IF NOT EXISTS idx_license_reports_type ON Data_License_Reports(ReportType, GeneratedAt DESC);
CREATE INDEX IF NOT EXISTS idx_license_reports_category ON Data_License_Reports(MaterialTypeCategory, GeneratedAt DESC);
CREATE INDEX IF NOT EXISTS idx_license_customers_status ON Data_License_Customers(Status);
CREATE INDEX IF NOT EXISTS idx_license_customers_tier ON Data_License_Customers(LicenseTier);
CREATE INDEX IF NOT EXISTS idx_license_access_customer ON Data_License_Access_Log(CustomerID, AccessedAt DESC);
CREATE INDEX IF NOT EXISTS idx_license_access_report ON Data_License_Access_Log(ReportID, AccessedAt DESC);

-- ============================================
-- MATERIALIZED VIEWS FOR FAST REPORTING
-- ============================================

-- Top 100 Searched Keywords (Updated Daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS Top_Searched_Keywords AS
SELECT 
  Keyword,
  SearchCount,
  MaterialTypeCategory,
  TrendDirection,
  UpdatedAt
FROM Search_Keywords_Aggregated
ORDER BY SearchCount DESC
LIMIT 100;

-- Certification Demand Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS Certification_Demand_Summary AS
SELECT 
  CertificationName,
  SUM(FilterCount) AS TotalSearches,
  AVG(RFQConversionRate) AS AvgConversionRate,
  AVG(AverageOrderValue) AS AvgOrderValue
FROM Certification_Preferences
GROUP BY CertificationName
ORDER BY TotalSearches DESC;

-- Geographic Market Gaps
CREATE MATERIALIZED VIEW IF NOT EXISTS Geographic_Market_Gaps AS
SELECT 
  Region,
  MaterialTypeCategory,
  AVG(DemandSupplyGap) AS AvgDemandSupplyGap,
  SUM(SearchVolume) AS TotalSearchVolume,
  SUM(RFQVolume) AS TotalRFQVolume,
  AVG(SupplierCount) AS AvgSupplierCount
FROM Geographic_Demand
WHERE TimePeriod >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY Region, MaterialTypeCategory
HAVING AVG(DemandSupplyGap) > 1.5 -- High demand, low supply
ORDER BY AVG(DemandSupplyGap) DESC;

-- Certification Performance Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS Certification_Performance_Summary AS
SELECT 
  CertificationName,
  SUM(TotalRFQsWithCert) AS TotalRFQs,
  AVG(WinRate) AS AvgWinRate,
  AVG(AveragePremium) AS AvgPremium,
  AVG(AverageTimeToClose) AS AvgTimeToClose
FROM Certification_Win_Analysis
WHERE TimePeriod >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY CertificationName
ORDER BY AvgWinRate DESC;

-- Comments for data licensing context
COMMENT ON TABLE Search_Events IS 'Anonymized search events for analytics. Session IDs are hashed.';
COMMENT ON TABLE Filter_Events IS 'Anonymized filter events tracking user preferences.';
COMMENT ON TABLE Data_License_Reports IS 'Pre-generated reports for data licensing customers.';
COMMENT ON TABLE Data_License_Customers IS 'Companies licensed to access aggregated market data.';
COMMENT ON VIEW Top_Searched_Keywords IS 'Materialized view of top 100 searched keywords. Refresh daily.';
COMMENT ON VIEW Geographic_Market_Gaps IS 'Regions with high demand and low supplier coverage.';
