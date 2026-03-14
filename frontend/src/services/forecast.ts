import api from '@/lib/api';

export interface ForecastPoint {
    date: string;
    price_low: number | null;
    price_mid: number | null;
    price_high: number | null;
}

export interface ForecastResponse {
    commodity: string;
    district: string;
    horizon_days: number;
    direction: 'up' | 'down' | 'flat';
    price_low: number | null;
    price_mid: number | null;
    price_high: number | null;
    confidence_colour: 'Green' | 'Yellow' | 'Red';
    tier_label: string;
    last_data_date: string;
    forecast_points: ForecastPoint[];
    coverage_message: string | null;
}

export const forecastService = {
    async getForecast(
        commodity: string,
        district: string,
        horizon: number = 14
    ): Promise<ForecastResponse> {
        const response = await api.get(
            `/forecast/${encodeURIComponent(commodity)}/${encodeURIComponent(district)}`,
            { params: { horizon } }
        );
        return response.data;
    },
};
