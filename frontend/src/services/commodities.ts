import api from '@/lib/api';
import { Commodity } from '@/types';

export interface CommodityResponse {
    id: string;
    name: string;
    name_local?: string;
    category?: string;
    unit?: string;
    created_at: string;
    updated_at: string;
}

export interface CommodityWithPrice {
    id: string;
    name: string;
    price: number;
    change: number;
    mandi: string;
    icon: string;
}

export const commoditiesService = {
    async getAll(params?: { category?: string; limit?: number }): Promise<Commodity[]> {
        console.log('[CommoditiesService] getAll called with params:', params);
        try {
            const response = await api.get('/commodities', { params });
            console.log('[CommoditiesService] Response received:', response.data?.length || 0, 'items');
            return response.data.map((commodity: any) => ({
                id: commodity.id,
                name: commodity.name,
                name_local: commodity.name_local,
                category: commodity.category || 'Uncategorized',
                unit: commodity.unit || 'kg',
                // These would come from price data in a real implementation
                latest_price: Math.floor(Math.random() * 5000) + 100,
                price_change: (Math.random() * 20) - 10,
                mandi: ['Kochi', 'Thrissur', 'Ernakulam', 'Kozhikode', 'Palakkad'][Math.floor(Math.random() * 5)]
            }));
        } catch (error) {
            console.error('[CommoditiesService] Error fetching commodities:', error);
            throw error;
        }
    },

    async getById(id: string): Promise<CommodityResponse> {
        const response = await api.get(`/commodities/${id}`);
        return response.data;
    },

    async getTopCommodities(limit: number = 5): Promise<CommodityWithPrice[]> {
        const response = await api.get('/commodities', {
            params: { limit }
        });

        // Transform commodities to include mock price data
        // In a real app, we'd fetch prices from /prices endpoint
        return response.data.map((commodity: CommodityResponse, index: number) => ({
            id: commodity.id,
            name: commodity.name,
            price: getBasePrice(commodity.name),
            change: (Math.random() * 20 - 10).toFixed(1),
            mandi: getRandomMandi(),
            icon: getIconForCommodity(commodity.name)
        }));
    }
};

function getIconForCommodity(name: string): string {
    const icons: { [key: string]: string } = {
        'rice': '🌾',
        'wheat': '🌾',
        'tomato': '🍅',
        'onion': '🧅',
        'potato': '🥔',
        'banana': '🍌',
        'coconut': '🥥',
        'cardamom': '🌿',
        'pepper': '🌶️',
        'rubber': '🌳',
    };
    return icons[name.toLowerCase()] || '🌱';
}

function getBasePrice(name: string): number {
    const prices: { [key: string]: number } = {
        'rice': 3250,
        'wheat': 2890,
        'tomato': 45,
        'onion': 35,
        'potato': 28,
        'banana': 60,
        'coconut': 25,
        'cardamom': 2500,
        'pepper': 450,
        'rubber': 150,
    };
    return prices[name.toLowerCase()] || 100;
}

function getRandomMandi(): string {
    const mandis = ['Kochi', 'Thrissur', 'Ernakulam', 'Kozhikode', 'Palakkad'];
    return mandis[Math.floor(Math.random() * mandis.length)];
}
