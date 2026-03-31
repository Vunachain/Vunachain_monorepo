export interface Farmer {
    id: string;
    celo_address: string;
    full_name: string;
    phone_number: string;
    national_id?: string;
    kyc_data: Record<string, unknown>;
    credit_score: number;
    is_verified: boolean;
    created_at: string;
}

export interface GeoJSONPolygon {
    type: "Polygon";
    coordinates: number[][][];
}

export interface Plot {
    id: string;
    farmer: string;
    name: string;
    boundary: GeoJSONPolygon;
    centroid?: {   // GeoJSON Point
        type: "Point";
        coordinates: [number, number];
    };
    area_hectares: number | null;
    crop_type?: string;
    is_eudr_compliant: boolean;
    last_checked_at: string;
}

export interface Harvest {
    record_id: number;
    farmer_address: string;
    crop_type: string;
    weight_kg: string;
    location: string;
    status: number;
    payout_amount_cusd: string;
    transaction_hash: string | null;
}

export interface SystemHealth {
    services: {
        database: { status: 'connected' | 'error'; latency: string };
        blockchain_sync: { status: 'active' | 'warning' | 'error'; last_synced_batch: string };
    };
    infrastructure: {
        memory_usage_mb: number;
        process_uptime: string;
        python_version: string;
        os: string;
        cpu_percent: number;
    };
}

export interface AdminUser {
    id: number;
    username: string;
    email: string;
    is_internal: boolean;
    primary_role: string;
    is_active: boolean;
    date_joined: string;
}

export interface FarmEvent {
    id: number;
    event_type: 'PLANTING' | 'SPRAYING' | 'HARVESTING' | 'INSPECTION' | 'OTHER' | 'INPUT_APPLICATION' | 'SOIL_TEST' | 'PEST_ALERT';
    plot: string;
    plot_name: string;
    farmer: string;
    farmer_name: string;
    timestamp: string;
    location?: {
        type: "Point";
        coordinates: [number, number];
    };
    photo_url?: string;
    chemical_name?: string;
    ph_level?: string;
    quality_grade?: 'A' | 'B' | 'C' | 'REJECTED';
    notes?: string;
    created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
    timestamp?: string;
}

export interface ApiError {
    status: number;
    message: string;
    code?: string;
    details?: Record<string, unknown>;
    timestamp?: string;
}

// User & Authentication
export type UserRole = 'admin' | 'case_officer' | 'agronomist' | 'farmer' | 'offtaker' | 'field_agent' | 'coop_manager';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    cooperativeId?: string;
    walletAddress?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthToken {
    access: string;
    refresh?: string;
    expires?: number;
}

// Dashboard Types
export interface DashboardMetrics {
    totalHarvest: number;
    averageQuality: number;
    complianceScore: number;
    revenueEarned: number;
    pendingPayouts?: number;
    activeContracts?: number;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    timestamp: string;
    [key: string]: string | number;
}

export interface TimeSeriesData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
    }>;
}

// Supply Chain & Contracts
export type ContractStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Contract {
    id: string;
    commodity: string;
    buyer_name: string;
    target_volume_kg: number;
    actual_volume_kg?: number;
    price_per_kg_cusd: number;
    status: ContractStatus;
    quality_specs: string;
    deadline?: string;
    created_at: string;
    updated_at: string;
}

export interface Supply {
    id: string;
    farmerId: string;
    contractId: string;
    quantity: number;
    deliveryDate: string;
    status: 'pending' | 'delivered' | 'received' | 'verified';
    quality?: 'high' | 'medium' | 'low';
    batchNumber?: string;
    transactionHash?: string;
}

// Blockchain & Payments
export interface PayoutRecord {
    farmerId: string;
    amount: string;
    status: 'pending' | 'completed' | 'failed';
    transactionHash: string;
    timestamp: string;
    currency: 'cUSD' | 'CELO';
}

export interface ContractEvent {
    id: string;
    transactionHash: string;
    eventType: 'HarvestLogged' | 'HarvestVerified' | 'PayoutTriggered' | 'BatchPayoutCreated';
    farmer: string;
    amount?: string;
    timestamp: string;
    blockNumber: number;
}

// Map and Location
export interface MapMarker {
    id: string;
    farmerId: string;
    farmerName: string;
    coordinates: [number, number];
    plotSize: number;
    cropType: string;
    status: 'active' | 'inactive' | 'flagged';
    color?: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

// Forms
export interface FarmerOnboardingData {
    full_name: string;
    email?: string;
    phone_number: string;
    national_id: string;
    celo_address?: string;
    plot_name: string;
    area_hectares: number;
    crop_type: string;
    latitude: number;
    longitude: number;
}

export interface EventLogFormData {
    farmer_id: string;
    plot_id: string;
    event_type: string;
    timestamp: string;
    location?: {
        type: "Point";
        coordinates: [number, number];
    };
    quality_grade?: string;
    notes?: string;
    photo_url?: string;
    chemical_name?: string;
    ph_level?: string;
}

export interface ProfileSettingsData {
    email: string;
    phone_number?: string;
    full_name: string;
    language: 'en' | 'sw' | 'fr';
    currency: 'cUSD' | 'KES' | 'USD';
    notifications_enabled: boolean;
    theme: 'light' | 'dark' | 'auto';
}
