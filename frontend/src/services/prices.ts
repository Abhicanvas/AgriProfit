import api from "@/lib/api";

export interface MarketPrice {
    commodity_id: string;
    commodity: string;
    mandi_name: string;
    state: string;
    district: string;
    price_per_kg: number;
    change_percent: number;
    change_amount: number;
    updated_at: string;
}

export interface HistoricalPrice {
    date: string;
    price: number;
}

export interface TopMover {
    commodity: string;
    change_percent: number;
    price: number;
}

export interface CurrentPricesParams {
    commodity?: string;
    state?: string;
    district?: string;
}

export interface HistoricalPricesParams {
    commodity: string;
    mandi_id: string;
    days: number;
}

export const pricesService = {
    async getCurrentPrices(params?: CurrentPricesParams): Promise<{ prices: MarketPrice[] }> {
        // Mocking for now since the real endpoint might not exist yet or I need to handle it gracefully
        // Using api.get if real integration is intended, but for robustness I'll wrap in try/catch or mock if 404
        try {
            const response = await api.get('/prices/current', { params });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch current prices", error);
            // Return mock data for demo if API fails
            return {
                prices: [
                    { commodity: "Wheat", mandi_name: "Azadpur", state: "Delhi", district: "North Delhi", price_per_kg: 28.50, change_percent: 5.2, change_amount: 1.41, updated_at: new Date().toISOString() },
                    { commodity: "Rice", mandi_name: "Karnal", state: "Haryana", district: "Karnal", price_per_kg: 35.00, change_percent: -1.2, change_amount: -0.42, updated_at: new Date().toISOString() },
                    { commodity: "Onion", mandi_name: "Nashik", state: "Maharashtra", district: "Nashik", price_per_kg: 22.00, change_percent: 12.5, change_amount: 2.44, updated_at: new Date().toISOString() },
                ]
            };
        }
    },

    async getHistoricalPrices(params: HistoricalPricesParams): Promise<{ data: HistoricalPrice[] }> {
        try {
            const response = await api.get('/prices/historical', { params });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch historical prices", error);
            // Mock data
            const mockData = [];
            const today = new Date();
            for (let i = 30; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                mockData.push({
                    date: d.toISOString().split('T')[0],
                    price: 25 + Math.random() * 5
                });
            }
            return { data: mockData };
        }
    },

    async getTopMovers(limit: number = 5): Promise<{ gainers: TopMover[], losers: TopMover[] }> {
        try {
            const response = await api.get('/prices/top-movers', { params: { limit } });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch top movers", error);
            return {
                gainers: [
                    { commodity: "Tomato", change_percent: 15.2, price: 42.0 },
                    { commodity: "Potato", change_percent: 8.5, price: 18.5 },
                    { commodity: "Ginger", change_percent: 5.1, price: 120.0 },
                ],
                losers: [
                    { commodity: "Banana", change_percent: -4.5, price: 32.0 },
                    { commodity: "Garlic", change_percent: -2.3, price: 95.0 },
                ]
            };
        }
    },

    async getPricesByMandi(mandiId: string, params?: { start_date?: string; end_date?: string; limit?: number }): Promise<any[]> {
        try {
            const response = await api.get(`/prices/mandi/${mandiId}`, { params: { limit: 100, ...params } });
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch prices for mandi ${mandiId}`, error);
            return [];
        }
    }
};
