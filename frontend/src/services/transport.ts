import api from '@/lib/api';

export interface CostBreakdown {
    transport_cost: number;
    toll_cost: number;
    loading_cost: number;
    unloading_cost: number;
    mandi_fee: number;
    commission: number;
    additional_cost: number;
    total_cost: number;
}

export interface MandiComparison {
    mandi_id: string | null;
    mandi_name: string;
    state: string;
    district: string;
    distance_km: number;
    price_per_kg: number;
    gross_revenue: number;
    costs: CostBreakdown;
    net_profit: number;
    profit_per_kg: number;
    roi_percentage: number;
    vehicle_type: 'TEMPO' | 'TRUCK_SMALL' | 'TRUCK_LARGE';
    vehicle_capacity_kg: number;
    trips_required: number;
    recommendation: 'recommended' | 'not_recommended';
}

export interface TransportCompareResponse {
    commodity: string;
    quantity_kg: number;
    source_district: string;
    comparisons: MandiComparison[];
    best_mandi: MandiComparison | null;
    total_mandis_analyzed: number;
}

export interface CompareRequest {
    commodity: string;
    quantity_kg: number;
    source_state: string;
    source_district: string;
    max_distance_km?: number;
    limit?: number;
}

export const transportService = {
    async compareCosts(data: CompareRequest): Promise<TransportCompareResponse> {
        const response = await api.post('/transport/compare', data);
        return response.data;
    },

    async getStates(): Promise<string[]> {
        const response = await api.get('/mandis/states');
        return response.data;
    },

    async getDistricts(state: string): Promise<string[]> {
        const response = await api.get('/mandis/districts', { params: { state } });
        return response.data;
    },

    async getVehicles(): Promise<Record<string, { capacity_kg: number; cost_per_km: number; description: string }>> {
        const response = await api.get('/transport/vehicles');
        return response.data?.vehicles || {};
    },
};
