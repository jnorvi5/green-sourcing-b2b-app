// GreenChainz SDA Data Connector - TypeScript Types
// Matches Autodesk's official api_spec_partner.yaml

export interface Amount {
    qty: number;
    unit: string;
}

export interface StatisticsMeasurement {
    mean: Amount;
    min: Amount;
    max: Amount;
    sd: number;
    byPercentile: {
        [percentile: string]: Amount;
    };
}

export interface ScopeStatisticsSet {
    A1A2A3: StatisticsMeasurement;
    A1?: StatisticsMeasurement;
    A2?: StatisticsMeasurement;
    A3?: StatisticsMeasurement;
    A4?: StatisticsMeasurement;
    A5?: StatisticsMeasurement;
    B1?: StatisticsMeasurement;
    B1_years?: number;
    B2?: StatisticsMeasurement;
    B2_years?: number;
    B3?: StatisticsMeasurement;
    B3_years?: number;
    B4?: StatisticsMeasurement;
    B4_years?: number;
    B5?: StatisticsMeasurement;
    B5_years?: number;
    B6?: StatisticsMeasurement;
    B6_years?: number;
    B7?: StatisticsMeasurement;
    B7_years?: number;
    C1?: StatisticsMeasurement;
    C2?: StatisticsMeasurement;
    C3?: StatisticsMeasurement;
    C4?: StatisticsMeasurement;
    D?: StatisticsMeasurement;
}

export interface EpdStatistics {
    epdCount: number;
    industryEpdCount: number;
    genericEstimateCount: number;
    declaredUnit: Amount;
    impactStatistics: ScopeStatisticsSet;
}

export interface EpdCategoryTree {
    id: string;
    displayName: string;
    masterformat: string;
    shortName: string;
    subcategories: EpdCategoryTree[];
}

export interface EpdCategory extends EpdStatistics {
    id: string;
    displayName: string;
    masterformat: string;
    shortName: string;
}

export interface EpdFilter {
    type: "jurisdictions";
    jurisdictions?: string[];
}

export interface PartnerError {
    title: string;
    detail: string;
    type: "INVALID_LICENSE" | "INVALID_PARAMS" | "NO_LICENSE";
    errors?: Array<{
        title: string;
        detail: string;
    }>;
}
