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
