export interface Farmer {
    id: string;
    celo_address: string;
    full_name: string;
    phone_number: string;
    national_id?: string;
    kyc_data: Record<string, any>;
    credit_score: number;
    is_verified: boolean;
    created_at: string;
}

export interface Plot {
    id: string;
    farmer: string;
    name: string;
    boundary: any; // GeoJSON Polygon
    centroid?: {   // GeoJSON Point
        type: "Point";
        coordinates: [number, number];
    };
    area_hectares: number | null;
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
