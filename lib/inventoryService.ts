// lib/inventoryService.ts - Inventory Management Service
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface InventoryItem {
    _id?: ObjectId;
    organizationId: string;
    sku: string;
    name: string;
    description?: string;
    category: string;
    subcategory?: string;

    // Stock levels
    quantity: number;
    unit: string;
    reservedQuantity: number;
    availableQuantity: number;

    // Thresholds
    reorderPoint: number;
    safetyStock: number;
    maxStock: number;

    // Location
    warehouseId?: string;
    warehouseName?: string;
    location?: {
        aisle: string;
        rack: string;
        shelf: string;
        bin: string;
    };

    // Pricing
    unitCost: number;
    currency: string;
    lastPurchasePrice?: number;
    avgPurchasePrice?: number;

    // Supplier info
    preferredSuppliers: {
        supplierId: string;
        supplierName: string;
        leadTime: number; // days
        minOrderQty: number;
        unitPrice: number;
        priority: number;
    }[];

    // Sustainability
    sustainability: {
        recycledContent: number; // percentage
        carbonFootprint: number; // kg CO2e per unit
        certifications: string[];
        isLocal: boolean;
        sustainabilityScore: number;
    };

    // Tracking
    batchTracking: boolean;
    serialTracking: boolean;
    expiryTracking: boolean;

    // Status
    status: 'active' | 'inactive' | 'discontinued' | 'pending';

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    lastStockCheck?: Date;
    lastOrderDate?: Date;
}

export interface InventoryTransaction {
    _id?: ObjectId;
    organizationId: string;
    transactionId: string;
    itemId: string;
    itemSku: string;
    type: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'return' | 'write_off';
    quantity: number;
    unit: string;

    // Before/After
    previousQuantity: number;
    newQuantity: number;

    // Reference
    referenceType?: 'purchase_order' | 'sales_order' | 'transfer_order' | 'adjustment' | 'manual';
    referenceId?: string;

    // Additional info
    batchNumber?: string;
    serialNumbers?: string[];
    expiryDate?: Date;

    // Location
    fromWarehouse?: string;
    toWarehouse?: string;
    fromLocation?: string;
    toLocation?: string;

    // Cost
    unitCost?: number;
    totalCost?: number;

    // User
    performedBy: string;
    performedByName: string;
    notes?: string;

    timestamp: Date;
}

export interface PurchaseOrder {
    _id?: ObjectId;
    organizationId: string;
    poNumber: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';

    // Supplier
    supplierId: string;
    supplierName: string;
    supplierEmail?: string;

    // Items
    items: {
        itemId: string;
        sku: string;
        name: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
        sustainabilityScore?: number;
    }[];

    // Totals
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    currency: string;

    // Dates
    orderDate: Date;
    expectedDelivery: Date;
    actualDelivery?: Date;

    // Shipping
    shippingAddress: {
        name: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };

    // Sustainability
    estimatedCarbonFootprint: number;
    sustainabilityNotes?: string;

    // Approval
    approvalRequired: boolean;
    approvedBy?: string;
    approvedAt?: Date;

    // Notes
    internalNotes?: string;
    supplierNotes?: string;

    // Tracking
    trackingNumbers?: string[];

    // Metadata
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StockAlert {
    _id?: ObjectId;
    organizationId: string;
    itemId: string;
    itemSku: string;
    itemName: string;
    alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon' | 'slow_moving';
    severity: 'low' | 'medium' | 'high' | 'critical';
    currentQuantity: number;
    threshold: number;
    message: string;
    suggestedAction: string;
    suggestedOrderQuantity?: number;
    suggestedSupplier?: {
        supplierId: string;
        supplierName: string;
        leadTime: number;
        unitPrice: number;
    };
    status: 'active' | 'acknowledged' | 'resolved' | 'snoozed';
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    snoozeUntil?: Date;
    createdAt: Date;
}

export const inventoryService = {
    // Item Management
    async createItem(item: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt' | 'availableQuantity'>): Promise<InventoryItem> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const newItem: InventoryItem = {
            ...item,
            availableQuantity: item.quantity - item.reservedQuantity,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('inventory').insertOne(newItem);
        return { ...newItem, _id: result.insertedId };
    },

    async getItem(itemId: string): Promise<InventoryItem | null> {
        const db = await getDb('greenchainz');
        return db.collection('inventory').findOne({ _id: new ObjectId(itemId) }) as Promise<InventoryItem | null>;
    },

    async getItemBySku(organizationId: string, sku: string): Promise<InventoryItem | null> {
        const db = await getDb('greenchainz');
        return db.collection('inventory').findOne({ organizationId, sku }) as Promise<InventoryItem | null>;
    },

    async updateItem(itemId: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
        const db = await getDb('greenchainz');

        // Recalculate available quantity if quantity or reserved changed
        if (updates.quantity !== undefined || updates.reservedQuantity !== undefined) {
            const currentItem = await this.getItem(itemId);
            if (currentItem) {
                const newQty = updates.quantity ?? currentItem.quantity;
                const newReserved = updates.reservedQuantity ?? currentItem.reservedQuantity;
                updates.availableQuantity = newQty - newReserved;
            }
        }

        return db.collection('inventory').findOneAndUpdate(
            { _id: new ObjectId(itemId) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        ) as Promise<InventoryItem | null>;
    },

    async listItems(
        organizationId: string,
        filters?: {
            category?: string;
            status?: string;
            lowStock?: boolean;
            search?: string;
        },
        pagination?: { page: number; limit: number }
    ): Promise<{ items: InventoryItem[]; total: number }> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { organizationId };

        if (filters?.category) query.category = filters.category;
        if (filters?.status) query.status = filters.status;
        if (filters?.lowStock) {
            query.$expr = { $lte: ['$quantity', '$reorderPoint'] };
        }
        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { sku: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
        const limit = pagination?.limit || 50;

        const [items, total] = await Promise.all([
            db.collection('inventory')
                .find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('inventory').countDocuments(query),
        ]);

        return { items: items as InventoryItem[], total };
    },

    // Transactions
    async recordTransaction(
        transaction: Omit<InventoryTransaction, '_id' | 'transactionId' | 'previousQuantity' | 'newQuantity' | 'timestamp'>
    ): Promise<InventoryTransaction> {
        const db = await getDb('greenchainz');
        const now = new Date();

        // Get current item quantity
        const item = await this.getItem(transaction.itemId);
        if (!item) throw new Error('Item not found');

        const previousQuantity = item.quantity;
        let newQuantity = previousQuantity;

        // Calculate new quantity based on transaction type
        switch (transaction.type) {
            case 'receipt':
            case 'return':
                newQuantity = previousQuantity + transaction.quantity;
                break;
            case 'issue':
            case 'write_off':
                newQuantity = previousQuantity - transaction.quantity;
                break;
            case 'adjustment':
                newQuantity = transaction.quantity; // Direct set
                break;
            case 'transfer':
                // Handled separately for from/to warehouses
                break;
        }

        // Generate transaction ID
        const transactionId = `TXN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;

        const newTransaction: InventoryTransaction = {
            ...transaction,
            transactionId,
            previousQuantity,
            newQuantity,
            timestamp: now,
        };

        // Update inventory quantity
        await this.updateItem(transaction.itemId, { quantity: newQuantity });

        // Record transaction
        const result = await db.collection('inventory_transactions').insertOne(newTransaction);

        // Check for alerts
        await this.checkStockAlerts(transaction.organizationId, transaction.itemId);

        return { ...newTransaction, _id: result.insertedId };
    },

    async getTransactions(
        organizationId: string,
        filters?: {
            itemId?: string;
            type?: string;
            dateRange?: { start: Date; end: Date };
        },
        limit = 100
    ): Promise<InventoryTransaction[]> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { organizationId };

        if (filters?.itemId) query.itemId = filters.itemId;
        if (filters?.type) query.type = filters.type;
        if (filters?.dateRange) {
            query.timestamp = {
                $gte: filters.dateRange.start,
                $lte: filters.dateRange.end,
            };
        }

        return db.collection('inventory_transactions')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray() as Promise<InventoryTransaction[]>;
    },

    // Purchase Orders
    async createPurchaseOrder(po: Omit<PurchaseOrder, '_id' | 'poNumber' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> {
        const db = await getDb('greenchainz');
        const now = new Date();

        // Generate PO number
        const year = now.getFullYear();
        const count = await db.collection('purchase_orders').countDocuments({
            organizationId: po.organizationId,
            createdAt: { $gte: new Date(year, 0, 1) },
        });
        const poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;

        const newPO: PurchaseOrder = {
            ...po,
            poNumber,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('purchase_orders').insertOne(newPO);
        return { ...newPO, _id: result.insertedId };
    },

    async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
        const db = await getDb('greenchainz');
        return db.collection('purchase_orders').findOne({ _id: new ObjectId(poId) }) as Promise<PurchaseOrder | null>;
    },

    async updatePurchaseOrder(poId: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
        const db = await getDb('greenchainz');
        return db.collection('purchase_orders').findOneAndUpdate(
            { _id: new ObjectId(poId) },
            { $set: { ...updates, updatedAt: new Date() } },
            { returnDocument: 'after' }
        ) as Promise<PurchaseOrder | null>;
    },

    async listPurchaseOrders(
        organizationId: string,
        filters?: {
            status?: string | string[];
            supplierId?: string;
            dateRange?: { start: Date; end: Date };
        },
        pagination?: { page: number; limit: number }
    ): Promise<{ orders: PurchaseOrder[]; total: number }> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { organizationId };

        if (filters?.status) {
            query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
        }
        if (filters?.supplierId) query.supplierId = filters.supplierId;
        if (filters?.dateRange) {
            query.orderDate = {
                $gte: filters.dateRange.start,
                $lte: filters.dateRange.end,
            };
        }

        const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
        const limit = pagination?.limit || 20;

        const [orders, total] = await Promise.all([
            db.collection('purchase_orders')
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('purchase_orders').countDocuments(query),
        ]);

        return { orders: orders as PurchaseOrder[], total };
    },

    async receivePurchaseOrder(
        poId: string,
        receivedItems: { itemId: string; quantity: number; batchNumber?: string }[],
        receivedBy: string,
        receivedByName: string
    ): Promise<PurchaseOrder | null> {
        const db = await getDb('greenchainz');
        const po = await this.getPurchaseOrder(poId);
        if (!po) return null;

        // Update received quantities and create inventory transactions
        const updatedItems = [...po.items];
        for (const received of receivedItems) {
            const itemIndex = updatedItems.findIndex((i) => i.itemId === received.itemId);
            if (itemIndex >= 0) {
                updatedItems[itemIndex].receivedQuantity += received.quantity;

                // Record inventory transaction
                await this.recordTransaction({
                    organizationId: po.organizationId,
                    itemId: received.itemId,
                    itemSku: updatedItems[itemIndex].sku,
                    type: 'receipt',
                    quantity: received.quantity,
                    unit: updatedItems[itemIndex].unit,
                    referenceType: 'purchase_order',
                    referenceId: po.poNumber,
                    batchNumber: received.batchNumber,
                    unitCost: updatedItems[itemIndex].unitPrice,
                    totalCost: received.quantity * updatedItems[itemIndex].unitPrice,
                    performedBy: receivedBy,
                    performedByName: receivedByName,
                });
            }
        }

        // Determine new status
        const allReceived = updatedItems.every((i) => i.receivedQuantity >= i.quantity);
        const anyReceived = updatedItems.some((i) => i.receivedQuantity > 0);
        const newStatus = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;

        return this.updatePurchaseOrder(poId, {
            items: updatedItems,
            status: newStatus,
            actualDelivery: allReceived ? new Date() : undefined,
        });
    },

    // Stock Alerts
    async checkStockAlerts(organizationId: string, itemId?: string): Promise<void> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { organizationId, status: 'active' };
        if (itemId) query._id = new ObjectId(itemId);

        const items = await db.collection('inventory').find(query).toArray() as InventoryItem[];
        const now = new Date();

        for (const item of items) {
            const alerts: Omit<StockAlert, '_id'>[] = [];

            // Check for low stock
            if (item.quantity <= item.reorderPoint && item.quantity > 0) {
                const suggestedSupplier = item.preferredSuppliers[0];
                alerts.push({
                    organizationId,
                    itemId: item._id!.toString(),
                    itemSku: item.sku,
                    itemName: item.name,
                    alertType: 'low_stock',
                    severity: item.quantity <= item.safetyStock ? 'high' : 'medium',
                    currentQuantity: item.quantity,
                    threshold: item.reorderPoint,
                    message: `Stock level (${item.quantity}) is below reorder point (${item.reorderPoint})`,
                    suggestedAction: 'Create purchase order to replenish stock',
                    suggestedOrderQuantity: item.maxStock - item.quantity,
                    suggestedSupplier: suggestedSupplier ? {
                        supplierId: suggestedSupplier.supplierId,
                        supplierName: suggestedSupplier.supplierName,
                        leadTime: suggestedSupplier.leadTime,
                        unitPrice: suggestedSupplier.unitPrice,
                    } : undefined,
                    status: 'active',
                    createdAt: now,
                });
            }

            // Check for out of stock
            if (item.quantity <= 0) {
                alerts.push({
                    organizationId,
                    itemId: item._id!.toString(),
                    itemSku: item.sku,
                    itemName: item.name,
                    alertType: 'out_of_stock',
                    severity: 'critical',
                    currentQuantity: 0,
                    threshold: 0,
                    message: `Item is out of stock`,
                    suggestedAction: 'Urgent: Create emergency purchase order',
                    suggestedOrderQuantity: item.maxStock,
                    status: 'active',
                    createdAt: now,
                });
            }

            // Check for overstock
            if (item.quantity > item.maxStock) {
                alerts.push({
                    organizationId,
                    itemId: item._id!.toString(),
                    itemSku: item.sku,
                    itemName: item.name,
                    alertType: 'overstock',
                    severity: 'low',
                    currentQuantity: item.quantity,
                    threshold: item.maxStock,
                    message: `Stock level (${item.quantity}) exceeds maximum (${item.maxStock})`,
                    suggestedAction: 'Consider reducing future orders or redistributing stock',
                    status: 'active',
                    createdAt: now,
                });
            }

            // Insert new alerts (avoiding duplicates)
            for (const alert of alerts) {
                const existingAlert = await db.collection('stock_alerts').findOne({
                    itemId: alert.itemId,
                    alertType: alert.alertType,
                    status: 'active',
                });

                if (!existingAlert) {
                    await db.collection('stock_alerts').insertOne(alert);
                }
            }
        }
    },

    async getAlerts(
        organizationId: string,
        filters?: { severity?: string; alertType?: string; status?: string }
    ): Promise<StockAlert[]> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { organizationId };

        if (filters?.severity) query.severity = filters.severity;
        if (filters?.alertType) query.alertType = filters.alertType;
        if (filters?.status) query.status = filters.status;
        else query.status = 'active';

        return db.collection('stock_alerts')
            .find(query)
            .sort({ severity: -1, createdAt: -1 })
            .toArray() as Promise<StockAlert[]>;
    },

    async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
        const db = await getDb('greenchainz');
        await db.collection('stock_alerts').updateOne(
            { _id: new ObjectId(alertId) },
            {
                $set: {
                    status: 'acknowledged',
                    acknowledgedBy: userId,
                    acknowledgedAt: new Date(),
                },
            }
        );
    },

    // Analytics
    async getInventoryStats(organizationId: string): Promise<{
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        avgTurnoverRate: number;
        sustainabilityScore: number;
    }> {
        const db = await getDb('greenchainz');

        const items = await db.collection('inventory')
            .find({ organizationId, status: 'active' })
            .toArray() as InventoryItem[];

        const totalItems = items.length;
        const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
        const lowStockItems = items.filter((i) => i.quantity <= i.reorderPoint && i.quantity > 0).length;
        const outOfStockItems = items.filter((i) => i.quantity <= 0).length;

        // Calculate average sustainability score
        const sustainabilityScore = items.length > 0
            ? items.reduce((sum, i) => sum + (i.sustainability?.sustainabilityScore || 0), 0) / items.length
            : 0;

        return {
            totalItems,
            totalValue,
            lowStockItems,
            outOfStockItems,
            avgTurnoverRate: 0, // Would need historical data
            sustainabilityScore,
        };
    },
};

export default inventoryService;
