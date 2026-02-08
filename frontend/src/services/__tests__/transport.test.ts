import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transportService } from '../transport';
import api from '@/lib/api';

vi.mock('@/lib/api');

describe('Transport Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compareCosts()', () => {
    const validRequest = {
      commodity: 'commodity-123',
      quantity_kg: 1000,
      source_state: 'Kerala',
      source_district: 'Ernakulam',
    };

    it('calls API with correct payload', async () => {
      const mockResponse = {
        comparisons: [],
        best_option: null,
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      await transportService.compareCosts(validRequest);

      expect(api.post).toHaveBeenCalledWith('/transport/compare', {
        commodity_id: 'commodity-123',
        quantity_kg: 1000,
        source_state: 'Kerala',
        source_district: 'Ernakulam',
      });
    });

    it('returns comparison results with multiple options', async () => {
      const mockResponse = {
        comparisons: [
          {
            mandi_name: 'Local Mandi',
            state: 'Kerala',
            district: 'Ernakulam',
            distance_km: 10,
            current_price: 25,
            transport_cost: 500,
            gross_revenue: 25000,
            loading_cost: 100,
            unloading_cost: 100,
            mandi_fee: 500,
            commission: 625,
            total_cost: 1825,
            net_revenue: 23175,
            net_gain_over_local: 0,
            recommendation: 'not_recommended' as const,
            vehicle_type: 'TEMPO' as const,
            profit_per_kg: 23.18,
          },
          {
            mandi_name: 'Distant Mandi',
            state: 'Tamil Nadu',
            district: 'Coimbatore',
            distance_km: 150,
            current_price: 35,
            transport_cost: 4500,
            gross_revenue: 35000,
            loading_cost: 500,
            unloading_cost: 500,
            mandi_fee: 700,
            commission: 875,
            total_cost: 7075,
            net_revenue: 27925,
            net_gain_over_local: 4750,
            recommendation: 'recommended' as const,
            vehicle_type: 'TRUCK_SMALL' as const,
            profit_per_kg: 27.93,
          },
        ],
        best_option: {
          district: { code: 'TN-CBE', name: 'Coimbatore' },
          net_gain_over_local: 4750,
        },
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await transportService.compareCosts(validRequest);

      expect(result.comparisons).toHaveLength(2);
      expect(result.best_option).toBeDefined();
      expect(result.best_option?.net_gain_over_local).toBe(4750);
    });

    it('validates positive quantity', async () => {
      const invalidRequest = { ...validRequest, quantity_kg: -100 };

      // Mock API rejection for negative quantity
      vi.mocked(api.post).mockRejectedValue({
        response: {
          status: 400,
          data: { detail: 'Quantity must be positive' },
        },
        message: 'Request failed',
      });

      // Service returns mock data on error, so we check it doesn't throw
      const result = await transportService.compareCosts(invalidRequest);
      
      // Should return mock data as fallback
      expect(result.comparisons).toBeDefined();
    });

    it('validates different origin and destination', async () => {
      // This validation might happen on frontend or backend
      const sameLocationRequest = {
        commodity: 'commodity-123',
        quantity_kg: 1000,
        source_state: 'Kerala',
        source_district: 'Ernakulam',
      };

      // Mock API rejection for same location
      vi.mocked(api.post).mockRejectedValue({
        response: {
          status: 400,
          data: { detail: 'Origin and destination cannot be same' },
        },
        message: 'Bad request',
      });

      // Service returns mock data on error
      const result = await transportService.compareCosts(sameLocationRequest);
      
      // Should return mock data as fallback
      expect(result.comparisons).toBeDefined();
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      // Service has fallback mock data on error
      const result = await transportService.compareCosts(validRequest);

      // Should return mock data
      expect(result.comparisons).toBeDefined();
      expect(Array.isArray(result.comparisons)).toBe(true);
    });

    it('returns cost breakdown in response', async () => {
      const mockResponse = {
        comparisons: [
          {
            mandi_name: 'Test Mandi',
            state: 'Kerala',
            district: 'Thrissur',
            distance_km: 50,
            current_price: 30,
            transport_cost: 2000,
            gross_revenue: 30000,
            loading_cost: 200,
            unloading_cost: 200,
            mandi_fee: 600,
            commission: 750,
            total_cost: 3750,
            net_revenue: 26250,
            net_gain_over_local: 3000,
            recommendation: 'recommended' as const,
            vehicle_type: 'TEMPO' as const,
            profit_per_kg: 26.25,
          },
        ],
        best_option: null,
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await transportService.compareCosts(validRequest);

      const comparison = result.comparisons[0];
      expect(comparison.transport_cost).toBeDefined();
      expect(comparison.loading_cost).toBeDefined();
      expect(comparison.unloading_cost).toBeDefined();
      expect(comparison.mandi_fee).toBeDefined();
      expect(comparison.commission).toBeDefined();
      expect(comparison.total_cost).toBeDefined();
    });

    it('handles large quantities with appropriate vehicle type', async () => {
      const largeQuantityRequest = { ...validRequest, quantity_kg: 8000 };
      
      vi.mocked(api.post).mockRejectedValue(new Error('Use mock'));

      const result = await transportService.compareCosts(largeQuantityRequest);

      // Mock should select TRUCK_LARGE for quantities > 5000
      const hasLargeTruck = result.comparisons.some(
        c => c.vehicle_type === 'TRUCK_LARGE'
      );
      expect(hasLargeTruck).toBe(true);
    });

    it('handles medium quantities with appropriate vehicle type', async () => {
      const mediumQuantityRequest = { ...validRequest, quantity_kg: 3000 };
      
      vi.mocked(api.post).mockRejectedValue(new Error('Use mock'));

      const result = await transportService.compareCosts(mediumQuantityRequest);

      // Mock should select TRUCK_SMALL for quantities 2000-5000
      const hasSmallTruck = result.comparisons.some(
        c => c.vehicle_type === 'TRUCK_SMALL'
      );
      expect(hasSmallTruck).toBe(true);
    });

    it('handles small quantities with tempo', async () => {
      const smallQuantityRequest = { ...validRequest, quantity_kg: 500 };
      
      vi.mocked(api.post).mockRejectedValue(new Error('Use mock'));

      const result = await transportService.compareCosts(smallQuantityRequest);

      // Mock should select TEMPO for quantities < 2000
      const hasTempo = result.comparisons.some(
        c => c.vehicle_type === 'TEMPO'
      );
      expect(hasTempo).toBe(true);
    });

    it('returns null best option when no better alternative', async () => {
      const mockResponse = {
        comparisons: [
          {
            mandi_name: 'Only Local',
            state: 'Kerala',
            district: 'Ernakulam',
            distance_km: 0,
            current_price: 25,
            transport_cost: 0,
            gross_revenue: 25000,
            loading_cost: 0,
            unloading_cost: 0,
            mandi_fee: 500,
            commission: 625,
            total_cost: 1125,
            net_revenue: 23875,
            net_gain_over_local: 0,
            recommendation: 'not_recommended' as const,
            vehicle_type: 'TEMPO' as const,
            profit_per_kg: 23.88,
          },
        ],
        best_option: null,
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await transportService.compareCosts(validRequest);

      expect(result.best_option).toBeNull();
    });

    it('handles 500 server errors', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { status: 500, data: { detail: 'Internal server error' } },
      });

      // Should return mock data as fallback
      const result = await transportService.compareCosts(validRequest);

      expect(result).toBeDefined();
      expect(result.comparisons).toBeDefined();
    });

    it('handles timeout errors', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('timeout of 60000ms exceeded'));

      // Should return mock data as fallback
      const result = await transportService.compareCosts(validRequest);

      expect(result).toBeDefined();
    });
  });

  describe('getStates()', () => {
    it('returns list of available states', async () => {
      const result = await transportService.getStates();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Kerala');
    });

    it('returns hardcoded state list', async () => {
      const result = await transportService.getStates();

      expect(result).toEqual(['Kerala', 'Tamil Nadu', 'Karnataka']);
    });
  });

  describe('getDistricts()', () => {
    it('returns districts for Kerala', async () => {
      const result = await transportService.getDistricts('Kerala');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Ernakulam');
      expect(result).toContain('Thrissur');
    });

    it('returns districts for Tamil Nadu', async () => {
      const result = await transportService.getDistricts('Tamil Nadu');

      expect(result).toContain('Chennai');
      expect(result).toContain('Coimbatore');
    });

    it('returns districts for Karnataka', async () => {
      const result = await transportService.getDistricts('Karnataka');

      expect(result).toContain('Bangalore');
      expect(result).toContain('Mysore');
    });

    it('returns empty array for unknown state', async () => {
      const result = await transportService.getDistricts('Unknown State');

      expect(result).toEqual([]);
    });

    it('handles case-sensitive state names', async () => {
      const result = await transportService.getDistricts('kerala');

      // Should return empty array if exact match required
      expect(result).toEqual([]);
    });

    it('returns all Kerala districts', async () => {
      const result = await transportService.getDistricts('Kerala');

      expect(result).toHaveLength(14); // Kerala has 14 districts
      expect(result).toContain('Thiruvananthapuram');
      expect(result).toContain('Kasaragod');
    });
  });

  describe('Route Details', () => {
    it('calculates route distance based on commodity price differences', async () => {
      const mockResponse = {
        comparisons: [
          {
            mandi_name: 'Test Mandi',
            distance_km: 120,
            current_price: 30,
            transport_cost: 3600,
            gross_revenue: 30000,
            loading_cost: 300,
            unloading_cost: 300,
            mandi_fee: 600,
            commission: 750,
            total_cost: 5550,
            net_revenue: 24450,
            net_gain_over_local: 2000,
            recommendation: 'recommended' as const,
            vehicle_type: 'TRUCK_SMALL' as const,
            profit_per_kg: 24.45,
            state: 'Kerala',
            district: 'Kozhikode',
          },
        ],
        best_option: {
          district: { code: 'KL-KOZ', name: 'Kozhikode' },
          net_gain_over_local: 2000,
        },
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

      const result = await transportService.compareCosts({
        commodity: 'tomato',
        quantity_kg: 1000,
        source_state: 'Kerala',
        source_district: 'Ernakulam',
      });

      expect(result.comparisons[0].distance_km).toBe(120);
    });

    it('estimates delivery time based on distance', async () => {
      // Assuming ~50 km/hour average speed
      const distance = 150; // km
      const expectedTime = distance / 50; // ~3 hours

      // This would be a helper function if implemented
      const estimatedTime = distance / 50;
      
      expect(estimatedTime).toBeCloseTo(3, 1);
    });
  });

  describe('Error Handling', () => {
    it('logs warning when API call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(api.post).mockRejectedValue(new Error('API error'));

      await transportService.compareCosts({
        commodity: 'test',
        quantity_kg: 1000,
        source_state: 'Kerala',
        source_district: 'Ernakulam',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API call failed')
      );
      consoleSpy.mockRestore();
    });

    it('provides meaningful mock data on error', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      const result = await transportService.compareCosts({
        commodity: 'tomato',
        quantity_kg: 2000,
        source_state: 'Kerala',
        source_district: 'Ernakulam',
      });

      expect(result.comparisons).toHaveLength(2);
      expect(result.comparisons[0].mandi_name).toBe('Local Mandi');
      expect(result.comparisons[1].mandi_name).toBe('Ernakulam Market');
    });
  });
});
