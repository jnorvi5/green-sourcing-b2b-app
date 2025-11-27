/**
 * Reports API
 *
 * Generate and manage procurement, carbon, and compliance reports
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IReportFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  suppliers?: string[];
  categories?: string[];
  orderStatuses?: string[];
}

interface IReport extends Document {
  userId: string;
  companyId: string;
  type: 'carbon' | 'procurement' | 'compliance' | 'supplier' | 'custom';
  name: string;
  description?: string;
  filters: IReportFilter;
  data: Record<string, unknown>;
  summary: {
    totalRecords: number;
    generatedAt: Date;
    timeRange: string;
    highlights: string[];
  };
  format: 'json' | 'csv' | 'pdf' | 'excel';
  fileUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  scheduled?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextRun: Date;
    recipients: string[];
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  userId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['carbon', 'procurement', 'compliance', 'supplier', 'custom'],
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  filters: {
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    suppliers: [{ type: String }],
    categories: [{ type: String }],
    orderStatuses: [{ type: String }],
  },
  data: { type: Schema.Types.Mixed },
  summary: {
    totalRecords: { type: Number },
    generatedAt: { type: Date },
    timeRange: { type: String },
    highlights: [{ type: String }],
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf', 'excel'],
    default: 'json',
  },
  fileUrl: { type: String },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating',
  },
  scheduled: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly'] },
    nextRun: { type: Date },
    recipients: [{ type: String }],
    isActive: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

// Mock data generators (in production, these would query actual data)
function generateCarbonReportData(filters: IReportFilter): Record<string, unknown> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return {
    totalEmissions: 1245.8,
    emissionsSaved: 387.2,
    savingsPercentage: 23.7,
    topContributors: [
      { category: 'Packaging', emissions: 456.2, percentage: 36.6 },
      { category: 'Raw Materials', emissions: 389.1, percentage: 31.2 },
      { category: 'Shipping', emissions: 234.5, percentage: 18.8 },
      { category: 'Manufacturing', emissions: 166.0, percentage: 13.3 },
    ],
    monthlyTrend: months.map((month, i) => ({
      month,
      emissions: 200 + Math.random() * 100,
      baseline: 280 + i * 5,
    })),
    supplierBreakdown: [
      { supplier: 'EcoMaterials Co', emissions: 234.5, rating: 'A' },
      { supplier: 'GreenPack Solutions', emissions: 198.3, rating: 'A+' },
      { supplier: 'Sustainable Supply', emissions: 345.2, rating: 'B' },
    ],
    recommendations: [
      'Switch to local supplier for packaging to reduce shipping emissions',
      'Consider recycled materials for Category B products',
      'Consolidate shipments to reduce transportation carbon',
    ],
  };
}

function generateProcurementReportData(filters: IReportFilter): Record<string, unknown> {
  return {
    totalSpend: 2456789.0,
    ordersPlaced: 847,
    averageOrderValue: 2901.16,
    supplierCount: 45,
    topCategories: [
      { category: 'Sustainable Packaging', spend: 567890, orders: 234 },
      { category: 'Recycled Materials', spend: 456789, orders: 189 },
      { category: 'Eco-Chemicals', spend: 345678, orders: 156 },
      { category: 'Bamboo Products', spend: 234567, orders: 98 },
      { category: 'Hemp Textiles', spend: 123456, orders: 67 },
    ],
    monthlySpend: [
      { month: 'Jan', spend: 389000, budget: 400000 },
      { month: 'Feb', spend: 412000, budget: 400000 },
      { month: 'Mar', spend: 378000, budget: 400000 },
      { month: 'Apr', spend: 423000, budget: 420000 },
      { month: 'May', spend: 445000, budget: 420000 },
      { month: 'Jun', spend: 409789, budget: 420000 },
    ],
    supplierPerformance: {
      onTimeDelivery: 94.5,
      qualityScore: 4.2,
      responseTime: 2.3, // hours
    },
    savingsAchieved: 156789,
    rfqMetrics: {
      sent: 234,
      received: 567,
      conversionRate: 41.2,
    },
  };
}

function generateComplianceReportData(filters: IReportFilter): Record<string, unknown> {
  return {
    overallScore: 87,
    certificationsValid: 12,
    certificationsExpiringSoon: 3,
    supplierCompliance: {
      total: 45,
      compliant: 41,
      nonCompliant: 2,
      pending: 2,
    },
    regulatoryStatus: [
      { regulation: 'ISO 14001', status: 'Compliant', validUntil: '2025-06-15' },
      { regulation: 'FSC Certified', status: 'Compliant', validUntil: '2024-12-01' },
      { regulation: 'EU REACH', status: 'Compliant', validUntil: '2025-03-20' },
      { regulation: 'OEKO-TEX', status: 'Expiring Soon', validUntil: '2024-08-15' },
    ],
    auditHistory: [
      { date: '2024-01-15', type: 'Internal', score: 89, findings: 2 },
      { date: '2024-03-20', type: 'External', score: 85, findings: 4 },
      { date: '2024-05-10', type: 'Internal', score: 91, findings: 1 },
    ],
    riskAreas: [
      { area: 'Supplier Documentation', risk: 'Medium', action: 'Request updated certs' },
      { area: 'Chemical Usage', risk: 'Low', action: 'Continue monitoring' },
    ],
    recommendations: [
      'Renew OEKO-TEX certification before August deadline',
      'Complete supplier documentation audit for Q3',
      'Schedule annual sustainability review',
    ],
  };
}

// GET - Fetch reports
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');
    const reportId = searchParams.get('reportId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch single report
    if (reportId) {
      const report = await Report.findById(reportId).lean();
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      return NextResponse.json({ report });
    }

    if (!userId && !companyId) {
      return NextResponse.json(
        { error: 'userId or companyId is required' },
        { status: 400 }
      );
    }

    // Build query
    const query: Record<string, unknown> = {};
    if (userId) query.userId = userId;
    if (companyId) query.companyId = companyId;
    if (type) query.type = type;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('-data') // Exclude large data field from list
        .lean(),
      Report.countDocuments(query),
    ]);

    // Get scheduled reports
    const scheduledReports = await Report.find({
      ...(userId ? { userId } : { companyId }),
      'scheduled.isActive': true,
    })
      .select('name type scheduled')
      .lean();

    return NextResponse.json({
      reports,
      total,
      scheduledReports,
      hasMore: offset + reports.length < total,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST - Generate a new report
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      userId,
      companyId,
      type,
      name,
      description,
      filters,
      format,
      scheduled,
    } = body;

    if (!userId || !companyId || !type || !name || !filters) {
      return NextResponse.json(
        { error: 'userId, companyId, type, name, and filters are required' },
        { status: 400 }
      );
    }

    // Generate report data based on type
    let data: Record<string, unknown>;
    let highlights: string[] = [];

    switch (type) {
      case 'carbon':
        data = generateCarbonReportData(filters);
        highlights = [
          `Total emissions: ${(data.totalEmissions as number).toFixed(1)} tCO2e`,
          `Savings achieved: ${(data.emissionsSaved as number).toFixed(1)} tCO2e (${data.savingsPercentage}%)`,
          `Top contributor: ${(data.topContributors as Array<{category: string}>)[0]?.category}`,
        ];
        break;
      case 'procurement':
        data = generateProcurementReportData(filters);
        highlights = [
          `Total spend: $${(data.totalSpend as number).toLocaleString()}`,
          `Orders placed: ${data.ordersPlaced}`,
          `Cost savings: $${(data.savingsAchieved as number).toLocaleString()}`,
        ];
        break;
      case 'compliance':
        data = generateComplianceReportData(filters);
        highlights = [
          `Compliance score: ${data.overallScore}%`,
          `Valid certifications: ${data.certificationsValid}`,
          `Expiring soon: ${data.certificationsExpiringSoon}`,
        ];
        break;
      default:
        data = {};
        highlights = [];
    }

    const report = new Report({
      userId,
      companyId,
      type,
      name,
      description,
      filters: {
        dateRange: {
          start: new Date(filters.dateRange?.start || Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(filters.dateRange?.end || Date.now()),
        },
        suppliers: filters.suppliers || [],
        categories: filters.categories || [],
        orderStatuses: filters.orderStatuses || [],
      },
      data,
      summary: {
        totalRecords: Math.floor(Math.random() * 1000) + 100,
        generatedAt: new Date(),
        timeRange: `${filters.dateRange?.start || 'Last 30 days'} - ${filters.dateRange?.end || 'Today'}`,
        highlights,
      },
      format: format || 'json',
      status: 'completed',
      scheduled: scheduled
        ? {
            ...scheduled,
            nextRun: calculateNextRun(scheduled.frequency),
            isActive: true,
          }
        : undefined,
    });

    await report.save();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// Helper to calculate next run date
function calculateNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
  }
  return now;
}

// PATCH - Update scheduled report settings
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { reportId, scheduled } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update scheduled settings
    if (scheduled) {
      report.scheduled = {
        ...report.scheduled,
        ...scheduled,
        nextRun: scheduled.frequency
          ? calculateNextRun(scheduled.frequency)
          : report.scheduled?.nextRun || new Date(),
      };
    }

    report.updatedAt = new Date();
    await report.save();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// DELETE - Remove a report
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    await Report.findByIdAndDelete(reportId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
