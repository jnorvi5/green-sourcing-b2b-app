// lib/budgetService.ts
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env['MONGODB_URI'] || '';

export interface BudgetCategory {
    id: string;
    name: string;
    parentId?: string;
    description?: string;
}

export interface BudgetLineItem {
    id: string;
    categoryId: string;
    name: string;
    plannedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    notes?: string;
}

export interface BudgetPeriod {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    lineItems: BudgetLineItem[];
}

export interface Budget {
    _id?: ObjectId;
    budgetId: string;
    organizationId: string;
    name: string;
    description?: string;
    fiscalYear: number;
    type: 'annual' | 'quarterly' | 'monthly' | 'project';
    status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'closed';

    currency: string;

    totalPlanned: number;
    totalActual: number;
    totalVariance: number;

    categories: BudgetCategory[];
    periods: BudgetPeriod[];

    sustainabilityAllocation?: {
        percentage: number;
        amount: number;
        categories: string[];
    };

    approvalWorkflow?: {
        requiredApprovers: string[];
        approvals: Array<{
            userId: string;
            userName: string;
            status: 'pending' | 'approved' | 'rejected';
            timestamp?: Date;
            comments?: string;
        }>;
    };

    alerts?: {
        warningThreshold: number; // Percentage of budget used to trigger warning
        criticalThreshold: number;
        recipients: string[];
    };

    tags?: string[];

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy?: string;
}

export interface Expense {
    _id?: ObjectId;
    expenseId: string;
    organizationId: string;
    budgetId: string;
    categoryId: string;
    periodId?: string;

    description: string;
    amount: number;
    currency: string;

    vendor?: string;
    invoiceNumber?: string;
    invoiceDate?: Date;
    paymentDate?: Date;

    status: 'pending' | 'approved' | 'rejected' | 'paid';

    attachments?: Array<{
        name: string;
        url: string;
        type: string;
        uploadedAt: Date;
    }>;

    sustainabilityImpact?: {
        carbonSavings?: number;
        isGreenPurchase: boolean;
        certifications?: string[];
    };

    approvedBy?: string;
    approvedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface BudgetForecast {
    _id?: ObjectId;
    forecastId: string;
    organizationId: string;
    budgetId: string;

    period: {
        startDate: Date;
        endDate: Date;
    };

    projectedSpend: number;
    confidenceLevel: 'low' | 'medium' | 'high';

    assumptions: string[];

    categoryBreakdown: Array<{
        categoryId: string;
        categoryName: string;
        projected: number;
        trend: 'increasing' | 'stable' | 'decreasing';
    }>;

    recommendations?: string[];

    createdAt: Date;
    createdBy: string;
}

class BudgetService {
    private client: MongoClient | null = null;

    private async getClient(): Promise<MongoClient> {
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }
        return this.client;
    }

    private async getBudgetCollection() {
        const client = await this.getClient();
        return client.db('greenchainz').collection<Budget>('budgets');
    }

    private async getExpenseCollection() {
        const client = await this.getClient();
        return client.db('greenchainz').collection<Expense>('expenses');
    }

    private async getForecastCollection() {
        const client = await this.getClient();
        return client.db('greenchainz').collection<BudgetForecast>('budget_forecasts');
    }

    private generateBudgetId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `BUD-${timestamp}-${random}`.toUpperCase();
    }

    private generateExpenseId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `EXP-${timestamp}-${random}`.toUpperCase();
    }

    // Budget CRUD
    async createBudget(data: Omit<Budget, '_id' | 'budgetId' | 'totalActual' | 'totalVariance' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
        const collection = await this.getBudgetCollection();

        const budget: Budget = {
            ...data,
            budgetId: this.generateBudgetId(),
            totalActual: 0,
            totalVariance: data.totalPlanned,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(budget);
        return { ...budget, _id: result.insertedId };
    }

    async getBudget(budgetId: string): Promise<Budget | null> {
        const collection = await this.getBudgetCollection();
        return collection.findOne({ budgetId });
    }

    async listBudgets(
        organizationId: string,
        filters?: {
            fiscalYear?: number;
            type?: Budget['type'];
            status?: Budget['status'];
        }
    ): Promise<Budget[]> {
        const collection = await this.getBudgetCollection();

        const query: Record<string, unknown> = { organizationId };

        if (filters?.fiscalYear) query['fiscalYear'] = filters.fiscalYear;
        if (filters?.type) query['type'] = filters.type;
        if (filters?.status) query['status'] = filters.status;

        return collection.find(query).sort({ createdAt: -1 }).toArray();
    }

    async updateBudget(budgetId: string, updates: Partial<Budget>, modifiedBy: string): Promise<Budget | null> {
        const collection = await this.getBudgetCollection();

        const result = await collection.findOneAndUpdate(
            { budgetId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date(),
                    lastModifiedBy: modifiedBy,
                }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async approveBudget(budgetId: string, userId: string, userName: string, approved: boolean, comments?: string): Promise<Budget | null> {
        const budget = await this.getBudget(budgetId);
        if (!budget) return null;

        const approvals = budget.approvalWorkflow?.approvals || [];
        const existingApprovalIndex = approvals.findIndex(a => a.userId === userId);

        const newApproval = {
            userId,
            userName,
            status: approved ? 'approved' as const : 'rejected' as const,
            timestamp: new Date(),
            comments,
        };

        if (existingApprovalIndex >= 0) {
            approvals[existingApprovalIndex] = newApproval;
        } else {
            approvals.push(newApproval);
        }

        // Check if all required approvers have approved
        const requiredApprovers = budget.approvalWorkflow?.requiredApprovers || [];
        const allApproved = requiredApprovers.every(approverId =>
            approvals.some(a => a.userId === approverId && a.status === 'approved')
        );

        const anyRejected = approvals.some(a => a.status === 'rejected');

        const newStatus = anyRejected ? 'draft' : (allApproved ? 'approved' : 'pending_approval');

        return this.updateBudget(budgetId, {
            status: newStatus,
            approvalWorkflow: {
                ...budget.approvalWorkflow!,
                approvals,
            },
        }, userId);
    }

    // Expense CRUD
    async createExpense(data: Omit<Expense, '_id' | 'expenseId' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        const collection = await this.getExpenseCollection();

        const expense: Expense = {
            ...data,
            expenseId: this.generateExpenseId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(expense);

        // Update budget actuals
        await this.updateBudgetActuals(expense.budgetId);

        return { ...expense, _id: result.insertedId };
    }

    async getExpense(expenseId: string): Promise<Expense | null> {
        const collection = await this.getExpenseCollection();
        return collection.findOne({ expenseId });
    }

    async listExpenses(
        organizationId: string,
        filters?: {
            budgetId?: string;
            categoryId?: string;
            status?: Expense['status'];
            fromDate?: Date;
            toDate?: Date;
            vendor?: string;
        },
        pagination?: { page: number; limit: number }
    ): Promise<{ expenses: Expense[]; total: number }> {
        const collection = await this.getExpenseCollection();

        const query: Record<string, unknown> = { organizationId };

        if (filters?.budgetId) query['budgetId'] = filters.budgetId;
        if (filters?.categoryId) query['categoryId'] = filters.categoryId;
        if (filters?.status) query['status'] = filters.status;
        if (filters?.vendor) query['vendor'] = { $regex: filters.vendor, $options: 'i' };

        if (filters?.fromDate || filters?.toDate) {
            query['createdAt'] = {};
            if (filters.fromDate) (query['createdAt'] as Record<string, Date>)['$gte'] = filters.fromDate;
            if (filters.toDate) (query['createdAt'] as Record<string, Date>)['$lte'] = filters.toDate;
        }

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const skip = (page - 1) * limit;

        const [expenses, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return { expenses, total };
    }

    async approveExpense(expenseId: string, userId: string, approved: boolean): Promise<Expense | null> {
        const collection = await this.getExpenseCollection();

        const result = await collection.findOneAndUpdate(
            { expenseId },
            {
                $set: {
                    status: approved ? 'approved' : 'rejected',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    updatedAt: new Date(),
                }
            },
            { returnDocument: 'after' }
        );

        if (result) {
            await this.updateBudgetActuals(result.budgetId);
        }

        return result;
    }

    private async updateBudgetActuals(budgetId: string): Promise<void> {
        const expenseCollection = await this.getExpenseCollection();
        const budgetCollection = await this.getBudgetCollection();

        // Get all approved expenses for this budget
        const expenses = await expenseCollection.find({
            budgetId,
            status: { $in: ['approved', 'paid'] },
        }).toArray();

        const totalActual = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const budget = await budgetCollection.findOne({ budgetId });
        if (!budget) return;

        const totalVariance = budget.totalPlanned - totalActual;

        // Update category-level actuals
        const categoryActuals: Record<string, number> = {};
        expenses.forEach(exp => {
            categoryActuals[exp.categoryId] = (categoryActuals[exp.categoryId] || 0) + exp.amount;
        });

        // Update line items in periods
        const updatedPeriods = budget.periods.map(period => ({
            ...period,
            lineItems: period.lineItems.map(item => {
                const actual = categoryActuals[item.categoryId] || 0;
                const variance = item.plannedAmount - actual;
                const variancePercentage = item.plannedAmount > 0
                    ? Math.round((variance / item.plannedAmount) * 100)
                    : 0;
                return {
                    ...item,
                    actualAmount: actual,
                    variance,
                    variancePercentage,
                };
            }),
        }));

        await budgetCollection.updateOne(
            { budgetId },
            {
                $set: {
                    totalActual,
                    totalVariance,
                    periods: updatedPeriods,
                    updatedAt: new Date(),
                }
            }
        );
    }

    // Analytics and Reporting
    async getBudgetSummary(organizationId: string, fiscalYear: number): Promise<{
        totalBudgeted: number;
        totalSpent: number;
        totalRemaining: number;
        utilizationPercentage: number;
        categoryBreakdown: Array<{
            category: string;
            budgeted: number;
            spent: number;
            remaining: number;
            utilizationPercentage: number;
        }>;
        monthlyTrend: Array<{
            month: string;
            budgeted: number;
            spent: number;
        }>;
        sustainabilitySpend: {
            total: number;
            percentage: number;
            greenPurchases: number;
        };
    }> {
        const budgetCollection = await this.getBudgetCollection();
        const expenseCollection = await this.getExpenseCollection();

        const budgets = await budgetCollection.find({
            organizationId,
            fiscalYear,
            status: { $in: ['approved', 'active'] },
        }).toArray();

        const totalBudgeted = budgets.reduce((sum, b) => sum + b.totalPlanned, 0);
        const totalSpent = budgets.reduce((sum, b) => sum + b.totalActual, 0);
        const totalRemaining = totalBudgeted - totalSpent;
        const utilizationPercentage = totalBudgeted > 0
            ? Math.round((totalSpent / totalBudgeted) * 100)
            : 0;

        // Category breakdown
        const categoryMap = new Map<string, { budgeted: number; spent: number }>();
        budgets.forEach(budget => {
            budget.categories.forEach(cat => {
                const existing = categoryMap.get(cat.name) || { budgeted: 0, spent: 0 };
                const categoryLineItems = budget.periods.flatMap(p =>
                    p.lineItems.filter(li => li.categoryId === cat.id)
                );
                const categoryBudgeted = categoryLineItems.reduce((sum, li) => sum + li.plannedAmount, 0);
                const categorySpent = categoryLineItems.reduce((sum, li) => sum + li.actualAmount, 0);
                categoryMap.set(cat.name, {
                    budgeted: existing.budgeted + categoryBudgeted,
                    spent: existing.spent + categorySpent,
                });
            });
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            budgeted: data.budgeted,
            spent: data.spent,
            remaining: data.budgeted - data.spent,
            utilizationPercentage: data.budgeted > 0
                ? Math.round((data.spent / data.budgeted) * 100)
                : 0,
        }));

        // Monthly trend
        const monthlyTrend: Array<{ month: string; budgeted: number; spent: number }> = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 12; i++) {
            const monthStart = new Date(fiscalYear, i, 1);
            const monthEnd = new Date(fiscalYear, i + 1, 0);

            const monthExpenses = await expenseCollection.find({
                organizationId,
                createdAt: { $gte: monthStart, $lte: monthEnd },
                status: { $in: ['approved', 'paid'] },
            }).toArray();

            monthlyTrend.push({
                month: months[i],
                budgeted: totalBudgeted / 12, // Simple monthly allocation
                spent: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
            });
        }

        // Sustainability spend
        const greenExpenses = await expenseCollection.find({
            organizationId,
            'sustainabilityImpact.isGreenPurchase': true,
            status: { $in: ['approved', 'paid'] },
        }).toArray();

        const sustainabilityTotal = greenExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
            totalBudgeted,
            totalSpent,
            totalRemaining,
            utilizationPercentage,
            categoryBreakdown,
            monthlyTrend,
            sustainabilitySpend: {
                total: sustainabilityTotal,
                percentage: totalSpent > 0 ? Math.round((sustainabilityTotal / totalSpent) * 100) : 0,
                greenPurchases: greenExpenses.length,
            },
        };
    }

    // Forecasting
    async generateForecast(
        organizationId: string,
        budgetId: string,
        forecastPeriod: { startDate: Date; endDate: Date },
        createdBy: string
    ): Promise<BudgetForecast> {
        const budget = await this.getBudget(budgetId);
        if (!budget) {
            throw new Error('Budget not found');
        }

        const expenseCollection = await this.getExpenseCollection();
        const forecastCollection = await this.getForecastCollection();

        // Get historical expenses for trend analysis
        const historicalExpenses = await expenseCollection.find({
            budgetId,
            status: { $in: ['approved', 'paid'] },
        }).toArray();

        // Simple trend-based forecast
        const monthsElapsed = this.getMonthsBetween(budget.createdAt, new Date());
        const avgMonthlySpend = monthsElapsed > 0
            ? budget.totalActual / monthsElapsed
            : budget.totalActual;

        const forecastMonths = this.getMonthsBetween(forecastPeriod.startDate, forecastPeriod.endDate);
        const projectedSpend = Math.round(avgMonthlySpend * forecastMonths * 100) / 100;

        // Category breakdown with trends
        const categoryBreakdown = budget.categories.map(cat => {
            const catExpenses = historicalExpenses.filter(e => e.categoryId === cat.id);
            const catTotal = catExpenses.reduce((sum, e) => sum + e.amount, 0);
            const avgCatMonthly = monthsElapsed > 0 ? catTotal / monthsElapsed : catTotal;

            // Simple trend detection
            const recentExpenses = catExpenses.filter(e =>
                new Date(e.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            );
            const recentAvg = recentExpenses.length > 0
                ? recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 3
                : avgCatMonthly;

            let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
            if (recentAvg > avgCatMonthly * 1.1) trend = 'increasing';
            else if (recentAvg < avgCatMonthly * 0.9) trend = 'decreasing';

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                projected: Math.round(avgCatMonthly * forecastMonths * 100) / 100,
                trend,
            };
        });

        // Determine confidence level
        let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
        if (monthsElapsed < 3) confidenceLevel = 'low';
        else if (monthsElapsed >= 6) confidenceLevel = 'high';

        const forecast: BudgetForecast = {
            forecastId: `FCT-${Date.now().toString(36)}`,
            organizationId,
            budgetId,
            period: forecastPeriod,
            projectedSpend,
            confidenceLevel,
            assumptions: [
                `Based on ${monthsElapsed} months of historical data`,
                'Assumes consistent spending patterns',
                'Does not account for seasonal variations',
            ],
            categoryBreakdown,
            recommendations: this.generateRecommendations(budget, projectedSpend, categoryBreakdown),
            createdAt: new Date(),
            createdBy,
        };

        const result = await forecastCollection.insertOne(forecast);
        return { ...forecast, _id: result.insertedId };
    }

    private generateRecommendations(
        budget: Budget,
        projectedSpend: number,
        categoryBreakdown: BudgetForecast['categoryBreakdown']
    ): string[] {
        const recommendations: string[] = [];

        // Budget utilization recommendation
        const projectedUtilization = (projectedSpend / budget.totalPlanned) * 100;
        if (projectedUtilization > 100) {
            recommendations.push(`Projected spend exceeds budget by ${Math.round(projectedUtilization - 100)}%. Consider reducing discretionary spending or requesting budget increase.`);
        } else if (projectedUtilization < 80) {
            recommendations.push(`Budget utilization is projected at ${Math.round(projectedUtilization)}%. Consider reallocating unused funds or accelerating planned purchases.`);
        }

        // Category-specific recommendations
        const increasingCategories = categoryBreakdown.filter(c => c.trend === 'increasing');
        if (increasingCategories.length > 0) {
            recommendations.push(`Monitor spending in ${increasingCategories.map(c => c.categoryName).join(', ')} as these categories show increasing trends.`);
        }

        // Sustainability recommendation
        if (budget.sustainabilityAllocation) {
            const sustainabilityTarget = budget.sustainabilityAllocation.amount;
            recommendations.push(`Ensure ${budget.sustainabilityAllocation.percentage}% sustainability allocation target ($${sustainabilityTarget.toLocaleString()}) is met.`);
        }

        return recommendations;
    }

    private getMonthsBetween(start: Date, end: Date): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12
            + (endDate.getMonth() - startDate.getMonth());
        return Math.max(1, months);
    }

    // Alert Management
    async checkBudgetAlerts(budgetId: string): Promise<Array<{
        type: 'warning' | 'critical';
        message: string;
        category?: string;
        utilizationPercentage: number;
    }>> {
        const budget = await this.getBudget(budgetId);
        if (!budget || !budget.alerts) return [];

        const alerts: Array<{
            type: 'warning' | 'critical';
            message: string;
            category?: string;
            utilizationPercentage: number;
        }> = [];

        const overallUtilization = (budget.totalActual / budget.totalPlanned) * 100;

        if (overallUtilization >= budget.alerts.criticalThreshold) {
            alerts.push({
                type: 'critical',
                message: `Overall budget utilization has reached ${Math.round(overallUtilization)}%`,
                utilizationPercentage: overallUtilization,
            });
        } else if (overallUtilization >= budget.alerts.warningThreshold) {
            alerts.push({
                type: 'warning',
                message: `Overall budget utilization has reached ${Math.round(overallUtilization)}%`,
                utilizationPercentage: overallUtilization,
            });
        }

        // Check category-level alerts
        budget.periods.forEach(period => {
            period.lineItems.forEach(item => {
                if (item.plannedAmount === 0) return;

                const utilization = (item.actualAmount / item.plannedAmount) * 100;
                const category = budget.categories.find(c => c.id === item.categoryId);

                if (utilization >= budget.alerts!.criticalThreshold) {
                    alerts.push({
                        type: 'critical',
                        message: `${category?.name || item.name} budget utilization at ${Math.round(utilization)}%`,
                        category: category?.name,
                        utilizationPercentage: utilization,
                    });
                } else if (utilization >= budget.alerts!.warningThreshold) {
                    alerts.push({
                        type: 'warning',
                        message: `${category?.name || item.name} budget utilization at ${Math.round(utilization)}%`,
                        category: category?.name,
                        utilizationPercentage: utilization,
                    });
                }
            });
        });

        return alerts;
    }
}

export const budgetService = new BudgetService();
