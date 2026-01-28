import api from '@/lib/api';
import { AuthResponse } from '@/types';

export const authService = {
    requestOtp: async (phoneNumber: string) => {
        const response = await api.post('/auth/request-otp', {
            phone_number: phoneNumber
        });
        return response.data;
    },

    verifyOtp: async (phoneNumber: string, otp: string): Promise<AuthResponse> => {
        const response = await api.post('/auth/verify-otp', {
            phone_number: phoneNumber,
            otp
        });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};