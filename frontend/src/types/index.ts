export interface User {
    id: number;
    phone_number: string;
    full_name?: string;
    email?: string;
    district?: string;
    role: 'farmer' | 'trader' | 'admin';
    is_active: boolean;
    created_at: string;
}

export interface Commodity {
    id: string;
    name: string;
    name_local?: string;
    category: string;
    unit: string;
    description?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    // Extended fields for display
    latest_price?: number;
    price_change?: number;
    mandi?: string;
}

export interface Mandi {
    id: string;
    name: string;
    state: string;
    district: string;
    market_code?: string;
    address?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PriceHistory {
    id: number;
    commodity_id: number;
    mandi_id: number;
    date: string;
    min_price: number;
    max_price: number;
    modal_price: number;
    arrival_quantity?: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    is_new_user: boolean;
}