'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleRequestOtp called with phone:', phoneNumber);

        if (phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        // Validate phone starts with 6-9 (Indian mobile)
        if (!/^[6-9]/.test(phoneNumber)) {
            toast.error('Phone number must start with 6, 7, 8, or 9');
            return;
        }

        setLoading(true);
        try {
            console.log('Calling authService.requestOtp...');
            await authService.requestOtp(phoneNumber);
            console.log('OTP request successful');
            toast.success('OTP sent to your phone!');
            setStep('otp');
        } catch (error: any) {
            console.error('OTP request failed:', error);
            const message = error.response?.data?.detail || 'Failed to send OTP. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleVerifyOtp called with otp:', otp);

        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        if (!/^\d+$/.test(otp)) {
            toast.error('OTP must contain only digits');
            return;
        }

        setLoading(true);
        try {
            console.log('Calling authService.verifyOtp...');
            const response = await authService.verifyOtp(phoneNumber, otp);
            console.log('OTP verification successful:', response);

            // Store the token
            localStorage.setItem('token', response.access_token);

            // Check if new user needs to complete profile
            if (response.is_new_user) {
                toast.success('Phone verified! Please complete your profile.');
                router.push(`/register?step=profile&token=${response.access_token}`);
                return;
            }

            // Fetch user data
            const user = await authService.getCurrentUser();
            console.log('User data fetched:', user);

            // Check if existing user has completed profile
            if (!user.is_profile_complete) {
                toast.info('Please complete your profile to continue.');
                router.push('/register?step=profile');
                return;
            }

            // Update auth store
            setAuth(user, response.access_token);

            toast.success('Login successful!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('OTP verification failed:', error);
            const message = error.response?.data?.detail || 'Invalid OTP. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="w-full max-w-md p-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-2">AgriProfit Login</h1>
                    <p className="text-gray-600 mb-6">
                        {step === 'phone'
                            ? 'Enter your phone number to receive OTP'
                            : 'Enter the OTP sent to your phone'}
                    </p>

                    {step === 'phone' ? (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    maxLength={10}
                                    required
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium mb-1">
                                    OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    required
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl tracking-widest"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('phone');
                                    setOtp('');
                                }}
                                className="w-full border py-2 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}
                    <p className="text-center text-sm text-gray-600 mt-4">
                        New to AgriProfit?{' '}
                        <a href="/register" className="text-green-600 hover:underline">
                            Register here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
