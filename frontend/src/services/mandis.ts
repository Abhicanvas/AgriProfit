import api from '@/lib/api';
import { Mandi } from '@/types';

export interface MandiResponse {
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
    created_at: string;
    updated_at: string;
}

export const mandisService = {
    async getAll(params?: { district?: string; state?: string; limit?: number }): Promise<Mandi[]> {
        console.log('[MandisService] getAll called with params:', params);
        try {
            const response = await api.get('/mandis', { params });
            console.log('[MandisService] Response received:', response.data?.length || 0, 'items');
            return response.data.map((mandi: MandiResponse) => ({
                id: mandi.id,
                name: mandi.name,
                state: mandi.state,
                district: mandi.district,
                market_code: mandi.market_code,
                address: mandi.address,
                pincode: mandi.pincode,
                latitude: mandi.latitude,
                longitude: mandi.longitude,
                is_active: mandi.is_active,
                created_at: mandi.created_at,
                updated_at: mandi.updated_at,
            }));
        } catch (error) {
            console.error('[MandisService] Error fetching mandis:', error);
            throw error;
        }
    },

    async getById(id: string): Promise<Mandi> {
        console.log('[MandisService] getById called with id:', id);
        const response = await api.get(`/mandis/${id}`);
        return response.data;
    },
};
