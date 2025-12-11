// lib/shipmentService.ts
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env['MONGODB_URI'] || '';

export interface ShipmentAddress {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
}

export interface ShipmentItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    weight: number;
    weightUnit: 'kg' | 'lb';
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: 'cm' | 'in';
    };
    value: number;
    currency: string;
    hsCode?: string;
}

export interface ShipmentEvent {
    id: string;
    timestamp: Date;
    status: string;
    location?: string;
    description: string;
    carrier?: string;
}

export interface CarrierInfo {
    name: string;
    code: string;
    serviceType: string;
    trackingNumber: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
}

export interface ShipmentDocument {
    type: 'bill_of_lading' | 'commercial_invoice' | 'packing_list' | 'customs_declaration' | 'certificate_of_origin' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
}

export interface CarbonFootprint {
    totalEmissions: number;
    unit: 'kgCO2e';
    transportMode: string;
    distance: number;
    distanceUnit: 'km' | 'mi';
    offsetStatus?: 'none' | 'partial' | 'full';
    offsetCredits?: number;
}

export interface Shipment {
    _id?: ObjectId;
    shipmentId: string;
    organizationId: string;
    orderId?: string;
    purchaseOrderId?: string;

    status: 'draft' | 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';

    origin: ShipmentAddress;
    destination: ShipmentAddress;

    items: ShipmentItem[];

    carrier: CarrierInfo;

    weight: {
        total: number;
        unit: 'kg' | 'lb';
    };

    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: 'cm' | 'in';
    };

    packageCount: number;
    packageType: 'box' | 'pallet' | 'crate' | 'envelope' | 'tube' | 'other';

    shippingMethod: 'ground' | 'express' | 'overnight' | 'freight' | 'ocean' | 'air';

    insurance?: {
        provider: string;
        policyNumber: string;
        coverage: number;
        currency: string;
    };

    customs?: {
        declarationNumber?: string;
        dutyAmount?: number;
        taxAmount?: number;
        currency?: string;
        clearanceStatus: 'pending' | 'in_progress' | 'cleared' | 'held';
    };

    costs: {
        shipping: number;
        insurance?: number;
        customs?: number;
        handling?: number;
        total: number;
        currency: string;
    };

    carbonFootprint?: CarbonFootprint;

    documents: ShipmentDocument[];
    events: ShipmentEvent[];

    notes?: string;
    tags?: string[];

    scheduledPickup?: Date;
    actualPickup?: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface ShipmentRate {
    carrier: string;
    carrierCode: string;
    service: string;
    serviceCode: string;
    rate: number;
    currency: string;
    estimatedDays: number;
    guaranteed: boolean;
    carbonEmissions?: number;
}

class ShipmentService {
    private client: MongoClient | null = null;

    private async getClient(): Promise<MongoClient> {
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }
        return this.client;
    }

    private async getCollection() {
        const client = await this.getClient();
        return client.db('greenchainz').collection<Shipment>('shipments');
    }

    private generateShipmentId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `SHP-${timestamp}-${random}`.toUpperCase();
    }

    async createShipment(data: Omit<Shipment, '_id' | 'shipmentId' | 'events' | 'createdAt' | 'updatedAt'>): Promise<Shipment> {
        const collection = await this.getCollection();

        const shipment: Shipment = {
            ...data,
            shipmentId: this.generateShipmentId(),
            events: [{
                id: new ObjectId().toString(),
                timestamp: new Date(),
                status: 'created',
                description: 'Shipment created',
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Calculate carbon footprint if not provided
        if (!shipment.carbonFootprint && shipment.shippingMethod) {
            shipment.carbonFootprint = await this.calculateCarbonFootprint(shipment);
        }

        const result = await collection.insertOne(shipment);
        return { ...shipment, _id: result.insertedId };
    }

    async getShipment(shipmentId: string): Promise<Shipment | null> {
        const collection = await this.getCollection();
        return collection.findOne({ shipmentId });
    }

    async getShipmentById(id: string): Promise<Shipment | null> {
        const collection = await this.getCollection();
        return collection.findOne({ _id: new ObjectId(id) });
    }

    async listShipments(
        organizationId: string,
        filters?: {
            status?: Shipment['status'];
            carrier?: string;
            fromDate?: Date;
            toDate?: Date;
            search?: string;
        },
        pagination?: { page: number; limit: number }
    ): Promise<{ shipments: Shipment[]; total: number }> {
        const collection = await this.getCollection();

        const query: Record<string, unknown> = { organizationId };

        if (filters?.status) {
            query['status'] = filters.status;
        }

        if (filters?.carrier) {
            query['carrier.code'] = filters.carrier;
        }

        if (filters?.fromDate || filters?.toDate) {
            query['createdAt'] = {};
            if (filters.fromDate) {
                (query['createdAt'] as Record<string, Date>)['$gte'] = filters.fromDate;
            }
            if (filters.toDate) {
                (query['createdAt'] as Record<string, Date>)['$lte'] = filters.toDate;
            }
        }

        if (filters?.search) {
            query['$or'] = [
                { shipmentId: { $regex: filters.search, $options: 'i' } },
                { 'carrier.trackingNumber': { $regex: filters.search, $options: 'i' } },
                { 'destination.name': { $regex: filters.search, $options: 'i' } },
                { 'destination.company': { $regex: filters.search, $options: 'i' } },
            ];
        }

        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const skip = (page - 1) * limit;

        const [shipments, total] = await Promise.all([
            collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
            collection.countDocuments(query),
        ]);

        return { shipments, total };
    }

    async updateShipment(shipmentId: string, updates: Partial<Shipment>): Promise<Shipment | null> {
        const collection = await this.getCollection();

        const result = await collection.findOneAndUpdate(
            { shipmentId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async updateStatus(
        shipmentId: string,
        status: Shipment['status'],
        location?: string,
        description?: string
    ): Promise<Shipment | null> {
        const collection = await this.getCollection();

        const event: ShipmentEvent = {
            id: new ObjectId().toString(),
            timestamp: new Date(),
            status,
            location,
            description: description || `Status updated to ${status}`,
        };

        const updateData: Record<string, unknown> = {
            status,
            updatedAt: new Date(),
        };

        // Set actual delivery date if delivered
        if (status === 'delivered') {
            updateData['actualDelivery'] = new Date();
        }

        const result = await collection.findOneAndUpdate(
            { shipmentId },
            {
                $set: updateData,
                $push: { events: event }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async addTrackingEvent(shipmentId: string, event: Omit<ShipmentEvent, 'id'>): Promise<Shipment | null> {
        const collection = await this.getCollection();

        const fullEvent: ShipmentEvent = {
            ...event,
            id: new ObjectId().toString(),
        };

        const result = await collection.findOneAndUpdate(
            { shipmentId },
            {
                $push: { events: fullEvent },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async addDocument(shipmentId: string, document: Omit<ShipmentDocument, 'uploadedAt'>): Promise<Shipment | null> {
        const collection = await this.getCollection();

        const fullDocument: ShipmentDocument = {
            ...document,
            uploadedAt: new Date(),
        };

        const result = await collection.findOneAndUpdate(
            { shipmentId },
            {
                $push: { documents: fullDocument },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async getShippingRates(
        origin: ShipmentAddress,
        destination: ShipmentAddress,
        weight: number,
        weightUnit: 'kg' | 'lb'
    ): Promise<ShipmentRate[]> {
        // Simulated rate calculation - in production, integrate with carrier APIs
        const distance = this.estimateDistance(origin, destination);
        const weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;

        const baseRates: ShipmentRate[] = [
            {
                carrier: 'EcoShip',
                carrierCode: 'ECOSP',
                service: 'Ground - Carbon Neutral',
                serviceCode: 'GROUND_CN',
                rate: Math.round((weightKg * 0.5 + distance * 0.02) * 100) / 100,
                currency: 'USD',
                estimatedDays: Math.ceil(distance / 500) + 2,
                guaranteed: false,
                carbonEmissions: weightKg * distance * 0.0001 * 0.5, // 50% offset
            },
            {
                carrier: 'GreenFreight',
                carrierCode: 'GRFRT',
                service: 'Express - Low Carbon',
                serviceCode: 'EXPRESS_LC',
                rate: Math.round((weightKg * 0.8 + distance * 0.035) * 100) / 100,
                currency: 'USD',
                estimatedDays: Math.ceil(distance / 800) + 1,
                guaranteed: true,
                carbonEmissions: weightKg * distance * 0.0001 * 0.7,
            },
            {
                carrier: 'SustainShip',
                carrierCode: 'SUSSH',
                service: 'Overnight - Zero Emission',
                serviceCode: 'OVERNIGHT_ZE',
                rate: Math.round((weightKg * 1.5 + distance * 0.05) * 100) / 100,
                currency: 'USD',
                estimatedDays: 1,
                guaranteed: true,
                carbonEmissions: 0, // Fully electric/offset
            },
            {
                carrier: 'OceanGreen',
                carrierCode: 'OCGRN',
                service: 'Ocean Freight - Eco',
                serviceCode: 'OCEAN_ECO',
                rate: Math.round((weightKg * 0.15 + distance * 0.005) * 100) / 100,
                currency: 'USD',
                estimatedDays: Math.ceil(distance / 100) + 14,
                guaranteed: false,
                carbonEmissions: weightKg * distance * 0.00003,
            },
        ];

        return baseRates.sort((a, b) => a.rate - b.rate);
    }

    async calculateCarbonFootprint(shipment: Shipment): Promise<CarbonFootprint> {
        const distance = this.estimateDistance(shipment.origin, shipment.destination);
        const weightKg = shipment.weight.unit === 'lb'
            ? shipment.weight.total * 0.453592
            : shipment.weight.total;

        // Emission factors (kgCO2e per kg per km)
        const emissionFactors: Record<string, number> = {
            ground: 0.0001,
            express: 0.00015,
            overnight: 0.0005,
            freight: 0.00008,
            ocean: 0.00003,
            air: 0.0008,
        };

        const factor = emissionFactors[shipment.shippingMethod] || 0.0001;
        const totalEmissions = Math.round(weightKg * distance * factor * 100) / 100;

        return {
            totalEmissions,
            unit: 'kgCO2e',
            transportMode: shipment.shippingMethod,
            distance,
            distanceUnit: 'km',
            offsetStatus: 'none',
        };
    }

    async offsetCarbonEmissions(
        shipmentId: string,
        offsetType: 'partial' | 'full',
        credits?: number
    ): Promise<Shipment | null> {
        const shipment = await this.getShipment(shipmentId);
        if (!shipment?.carbonFootprint) return null;

        const requiredCredits = offsetType === 'full'
            ? shipment.carbonFootprint.totalEmissions
            : credits || shipment.carbonFootprint.totalEmissions * 0.5;

        const updatedFootprint: CarbonFootprint = {
            ...shipment.carbonFootprint,
            offsetStatus: offsetType,
            offsetCredits: requiredCredits,
        };

        return this.updateShipment(shipmentId, { carbonFootprint: updatedFootprint });
    }

    async getShipmentAnalytics(
        organizationId: string,
        fromDate: Date,
        toDate: Date
    ): Promise<{
        totalShipments: number;
        deliveredOnTime: number;
        averageDeliveryDays: number;
        totalCarbonEmissions: number;
        totalCarbonOffset: number;
        costBreakdown: Record<string, number>;
        carrierPerformance: Array<{
            carrier: string;
            shipments: number;
            onTimeRate: number;
            avgDeliveryDays: number;
        }>;
    }> {
        const collection = await this.getCollection();

        const shipments = await collection.find({
            organizationId,
            createdAt: { $gte: fromDate, $lte: toDate },
        }).toArray();

        const delivered = shipments.filter(s => s.status === 'delivered');
        const onTime = delivered.filter(s => {
            if (!s.actualDelivery || !s.estimatedDelivery) return false;
            return s.actualDelivery <= s.estimatedDelivery;
        });

        const deliveryDays = delivered
            .filter(s => s.actualDelivery && s.createdAt)
            .map(s => {
                const diff = new Date(s.actualDelivery!).getTime() - new Date(s.createdAt).getTime();
                return diff / (1000 * 60 * 60 * 24);
            });

        const avgDeliveryDays = deliveryDays.length > 0
            ? deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length
            : 0;

        const totalEmissions = shipments.reduce(
            (sum, s) => sum + (s.carbonFootprint?.totalEmissions || 0),
            0
        );

        const totalOffset = shipments.reduce(
            (sum, s) => sum + (s.carbonFootprint?.offsetCredits || 0),
            0
        );

        // Cost breakdown by method
        const costBreakdown: Record<string, number> = {};
        shipments.forEach(s => {
            const method = s.shippingMethod || 'other';
            costBreakdown[method] = (costBreakdown[method] || 0) + s.costs.total;
        });

        // Carrier performance
        const carrierMap = new Map<string, { shipments: Shipment[]; delivered: Shipment[] }>();
        shipments.forEach(s => {
            const carrier = s.carrier?.name || 'Unknown';
            if (!carrierMap.has(carrier)) {
                carrierMap.set(carrier, { shipments: [], delivered: [] });
            }
            carrierMap.get(carrier)!.shipments.push(s);
            if (s.status === 'delivered') {
                carrierMap.get(carrier)!.delivered.push(s);
            }
        });

        const carrierPerformance = Array.from(carrierMap.entries()).map(([carrier, data]) => {
            const carrierOnTime = data.delivered.filter(s => {
                if (!s.actualDelivery || !s.estimatedDelivery) return false;
                return s.actualDelivery <= s.estimatedDelivery;
            });

            const carrierDeliveryDays = data.delivered
                .filter(s => s.actualDelivery && s.createdAt)
                .map(s => {
                    const diff = new Date(s.actualDelivery!).getTime() - new Date(s.createdAt).getTime();
                    return diff / (1000 * 60 * 60 * 24);
                });

            return {
                carrier,
                shipments: data.shipments.length,
                onTimeRate: data.delivered.length > 0
                    ? Math.round((carrierOnTime.length / data.delivered.length) * 100)
                    : 0,
                avgDeliveryDays: carrierDeliveryDays.length > 0
                    ? Math.round((carrierDeliveryDays.reduce((a, b) => a + b, 0) / carrierDeliveryDays.length) * 10) / 10
                    : 0,
            };
        });

        return {
            totalShipments: shipments.length,
            deliveredOnTime: onTime.length,
            averageDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
            totalCarbonEmissions: Math.round(totalEmissions * 100) / 100,
            totalCarbonOffset: Math.round(totalOffset * 100) / 100,
            costBreakdown,
            carrierPerformance,
        };
    }

    async getActiveShipments(organizationId: string): Promise<Shipment[]> {
        const collection = await this.getCollection();

        return collection.find({
            organizationId,
            status: { $in: ['booked', 'picked_up', 'in_transit', 'out_for_delivery'] },
        }).sort({ estimatedDelivery: 1 }).toArray();
    }

    async getDeliveryExceptions(organizationId: string): Promise<Shipment[]> {
        const collection = await this.getCollection();

        return collection.find({
            organizationId,
            status: 'exception',
        }).sort({ updatedAt: -1 }).toArray();
    }

    private estimateDistance(origin: ShipmentAddress, destination: ShipmentAddress): number {
        // Simplified distance estimation based on country/region
        // In production, use actual geocoding/routing APIs

        if (origin.country !== destination.country) {
            // International shipment - estimate based on common routes
            const internationalDistances: Record<string, number> = {
                'US-CN': 11000,
                'US-DE': 7500,
                'US-UK': 6000,
                'US-JP': 9000,
                'US-MX': 2000,
                'US-CA': 1500,
            };

            const routeKey = `${origin.country}-${destination.country}`;
            const reverseKey = `${destination.country}-${origin.country}`;

            return internationalDistances[routeKey] || internationalDistances[reverseKey] || 5000;
        }

        // Domestic shipment - rough estimate based on states
        if (origin.state === destination.state) {
            return 200; // Same state
        }

        // Cross-state estimate
        return 1500;
    }

    async cancelShipment(shipmentId: string, reason: string): Promise<Shipment | null> {
        return this.updateStatus(shipmentId, 'cancelled', undefined, `Cancelled: ${reason}`);
    }

    async schedulePickup(
        shipmentId: string,
        pickupDate: Date,
        pickupWindow?: { from: string; to: string }
    ): Promise<Shipment | null> {
        const collection = await this.getCollection();

        const event: ShipmentEvent = {
            id: new ObjectId().toString(),
            timestamp: new Date(),
            status: 'pickup_scheduled',
            description: `Pickup scheduled for ${pickupDate.toLocaleDateString()}${pickupWindow ? ` between ${pickupWindow.from} - ${pickupWindow.to}` : ''
                }`,
        };

        const result = await collection.findOneAndUpdate(
            { shipmentId },
            {
                $set: {
                    scheduledPickup: pickupDate,
                    status: 'booked',
                    updatedAt: new Date()
                },
                $push: { events: event }
            },
            { returnDocument: 'after' }
        );

        return result;
    }
}

export const shipmentService = new ShipmentService();
