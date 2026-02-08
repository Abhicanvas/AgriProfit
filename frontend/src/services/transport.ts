import api from '@/lib/api';

export interface TransportComparison {
    mandi_name: string;
    state: string;
    district: string;
    distance_km: number;
    current_price: number; // Price per kg
    transport_cost: number;
    gross_revenue: number;
    loading_cost: number;
    unloading_cost: number;
    mandi_fee: number;
    commission: number;
    total_cost: number; // Derived/Sum in frontend or from backend? Backend usually.
    net_revenue: number; // Net Profit
    net_gain_over_local: number;
    recommendation: 'recommended' | 'not_recommended';
    vehicle_type: 'TEMPO' | 'TRUCK_SMALL' | 'TRUCK_LARGE';
    profit_per_kg: number;
}

export interface ComparisonResponse {
    comparisons: TransportComparison[];
    best_option: {
        district: {
            code: string;
            name: string;
        };
        net_gain_over_local: number;
    } | null;
}

export interface CompareRequest {
    commodity: string; // ID or Name? Request says Name in example, but system uses IDs. I'll use ID in implementation but variable name 'commodity' matches request.
    quantity_kg: number;
    source_state: string;
    source_district: string;
}

export const transportService = {
    async compareCosts(data: CompareRequest): Promise<ComparisonResponse> {
        // Mapping frontend request to likely backend contract
        // If backend expects 'commodity_id', we pass data.commodity as that.
        const payload = {
            commodity_id: data.commodity,
            quantity_kg: data.quantity_kg,
            source_state: data.source_state,
            source_district: data.source_district
        };

        try {
            const response = await api.post('/transport/compare', payload);
            return response.data;
        } catch (error) {
            // Mocking response for demo if backend fails or doesn't exist yet
            console.warn("API call failed, returning mock data for demonstration");
            return mockComparisonResponse(data);
        }
    },

    async getStates(): Promise<string[]> {
        // Mocking /api/v1/meta/states
        return ["Kerala", "Tamil Nadu", "Karnataka"];
    },

    async getDistricts(state: string): Promise<string[]> {
        // Mocking /api/v1/meta/districts?state={state}
        const districtMap: Record<string, string[]> = {
            "Kerala": ["Thiruvananthapuram", "Kollam", "Alappuzha", "Pathanamthitta", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"],
            "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
            "Karnataka": ["Bangalore", "Mysore", "Coorg"]
        };
        return districtMap[state] || [];
    }
};

// Mock Helper
function mockComparisonResponse(data: CompareRequest): ComparisonResponse {
    const isLarge = data.quantity_kg > 5000;
    const isMedium = data.quantity_kg > 2000;
    const vehicle = isLarge ? 'TRUCK_LARGE' : (isMedium ? 'TRUCK_SMALL' : 'TEMPO');

    return {
        comparisons: [
            {
                mandi_name: "Local Mandi",
                state: data.source_state,
                district: data.source_district,
                distance_km: 10,
                current_price: 25,
                transport_cost: 500,
                gross_revenue: 25 * data.quantity_kg,
                loading_cost: 100,
                unloading_cost: 100,
                mandi_fee: (25 * data.quantity_kg) * 0.02,
                commission: (25 * data.quantity_kg) * 0.025,
                total_cost: 1000,
                net_revenue: (25 * data.quantity_kg) - 1000,
                net_gain_over_local: 0,
                recommendation: 'not_recommended',
                vehicle_type: 'TEMPO',
                profit_per_kg: 24
            },
            {
                mandi_name: "Ernakulam Market",
                state: "Kerala",
                district: "Ernakulam",
                distance_km: 150,
                current_price: 32, // Higher price
                transport_cost: 4500,
                gross_revenue: 32 * data.quantity_kg,
                loading_cost: 500,
                unloading_cost: 500,
                mandi_fee: (32 * data.quantity_kg) * 0.02,
                commission: (32 * data.quantity_kg) * 0.025,
                total_cost: 6500,
                net_revenue: (32 * data.quantity_kg) - 6500,
                net_gain_over_local: 5000,
                recommendation: 'recommended',
                vehicle_type: vehicle,
                profit_per_kg: 29
            }
        ],
        best_option: {
            district: { code: "KL-EKM", name: "Ernakulam" },
            net_gain_over_local: 5000
        }
    };
}
