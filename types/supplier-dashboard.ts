/**
 * Type definitions for Supplier Dashboard
 */

export interface DashboardStats {
  totalRfqMatches: number;
  pendingQuotes: number;
  acceptedQuotes: number;
  profileCompleteness: number;
  // Enhanced metrics
  averageResponseTime?: number;
  winRate?: number;
  monthlyRevenue?: number;
  activeOpportunities?: number;
}

export interface Notification {
  id: string;
  type: 'new_rfq' | 'quote_status' | 'urgent_deadline' | 'milestone';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface AnalyticsData {
  winRateData: Array<{
    month: string;
    winRate: number;
    totalQuotes: number;
    acceptedQuotes: number;
  }>;
  responseTime: {
    averageHours: number;
    status: 'good' | 'warning' | 'critical';
    color: string;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    growthPercent: number;
  }>;
  funnelData: Array<{
    stage: string;
    count: number;
    percentage: number;
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  responseTimeStatus: 'good' | 'warning' | 'critical';
  winRate: number;
  winRateTrend: 'up' | 'down' | 'stable';
  monthlyRevenue: number;
  activeOpportunities: number;
}

export interface IncomingRfq {
  id: string;
  project_name: string;
  material_type: string;
  delivery_deadline: string | null;
  match_score: number;
  created_at: string;
  architect: {
    full_name: string | null;
    company_name: string | null;
  };
}

export interface SupplierQuote {
  id: string;
  rfq_id: string;
  quote_amount: number;
  status: 'submitted' | 'accepted' | 'rejected';
  responded_at: string;
  rfq: {
    project_name: string;
  };
}

export interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  description: string | null;
  certifications: Array<{
    type: string;
    cert_number?: string;
    expiry?: string;
  }>;
  geographic_coverage: string[];
  scraped_data?: Array<{
    id: string;
    url: string;
    data_type: string;
    data: any;
    scraped_at: string;
  }>;
}

export interface Product {
  id: string;
  supplier_id: string;
  product_name: string;
  material_type: string;
  description: string | null;
}
