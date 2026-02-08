'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { mandisService } from '@/services/mandis';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Phone, Shield, User } from 'lucide-react';

// Indian states list
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
];

type RegistrationStep = 'phone' | 'otp' | 'profile';

interface StepIndicatorProps {
    currentStep: RegistrationStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
    const steps = [
        { id: 'phone', label: 'Phone', icon: Phone },
        { id: 'otp', label: 'Verify', icon: Shield },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const getStepState = (stepId: string) => {
        const stepOrder = ['phone', 'otp', 'profile'];
        const currentIndex = stepOrder.indexOf(currentStep);
        const stepIndex = stepOrder.indexOf(stepId);
        
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => {
                const state = getStepState(step.id);
                const Icon = step.icon;
                
                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    state === 'completed'
                                        ? 'bg-green-500 text-white'
                                        : state === 'current'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                {state === 'completed' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </div>
                            <span className={`text-xs mt-1 ${
                                state === 'current' ? 'text-green-600 font-medium' : 'text-gray-500'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`w-12 h-0.5 mx-2 ${
                                    getStepState(steps[index + 1].id) !== 'upcoming'
                                        ? 'bg-green-500'
                                        : 'bg-gray-200'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    
    // Check if we're coming from login with a new user
    const initialPhone = searchParams.get('phone') || '';
    const initialStep = searchParams.get('step') as RegistrationStep || 'phone';
    const token = searchParams.get('token') || '';
    
    const [step, setStep] = useState<RegistrationStep>(initialStep);
    const [phoneNumber, setPhoneNumber] = useState(initialPhone);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Profile form state
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [state, setState] = useState('');
    const [district, setDistrict] = useState('');
    const [districts, setDistricts] = useState<string[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Fetch districts when state changes
    useEffect(() => {
        if (state) {
            setLoadingDistricts(true);
            setDistrict(''); // Reset district when state changes
            mandisService.getDistrictsByState(state)
                .then(setDistricts)
                .catch(() => {
                    toast.error('Failed to load districts');
                    setDistricts([]);
                })
                .finally(() => setLoadingDistricts(false));
        } else {
            setDistricts([]);
            setDistrict('');
        }
    }, [state]);

    // If we have a token from login, store it and go to profile step
    if (token && step !== 'profile') {
        localStorage.setItem('token', token);
        setStep('profile');
    }

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (phoneNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        if (!/^[6-9]/.test(phoneNumber)) {
            toast.error('Phone number must start with 6, 7, 8, or 9');
            return;
        }

        setLoading(true);
        try {
            await authService.requestOtp(phoneNumber);
            toast.success('OTP sent to your phone!');
            setStep('otp');
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to send OTP. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

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
            const response = await authService.verifyOtp(phoneNumber, otp);
            localStorage.setItem('token', response.access_token);
            
            if (response.is_new_user) {
                toast.success('Phone verified! Please complete your profile.');
                setStep('profile');
            } else {
                // Existing user, check if profile is complete
                const user = await authService.getCurrentUser();
                if (user.is_profile_complete) {
                    setAuth(user, response.access_token);
                    toast.success('Welcome back!');
                    router.push('/dashboard');
                } else {
                    setStep('profile');
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Invalid OTP. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
            toast.error('Please enter a valid age (18-120)');
            return;
        }

        if (!state) {
            toast.error('Please select your state');
            return;
        }

        if (!district) {
            toast.error('Please select your district');
            return;
        }

        setLoading(true);
        try {
            const user = await authService.completeProfile({
                name: name.trim(),
                age: ageNum,
                state,
                district,
            });
            
            const storedToken = localStorage.getItem('token');
            setAuth(user, storedToken || '');
            
            toast.success('Registration complete! Welcome to AgriProfit!');
            router.push('/dashboard');
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to save profile. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-green-700">
                        Join AgriProfit
                    </CardTitle>
                    <CardDescription>
                        {step === 'phone' && 'Enter your phone number to get started'}
                        {step === 'otp' && 'Enter the OTP sent to your phone'}
                        {step === 'profile' && 'Complete your profile to personalize your experience'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StepIndicator currentStep={step} />

                    {step === 'phone' && (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        +91
                                    </span>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="rounded-l-none"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </Button>
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <a href="/login" className="text-green-600 hover:underline">
                                    Login here
                                </a>
                            </p>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-2xl tracking-widest"
                                    disabled={loading}
                                    autoFocus
                                />
                                <p className="text-sm text-gray-500">
                                    OTP sent to +91 {phoneNumber}
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            <div className="flex justify-between text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="text-gray-600 hover:underline"
                                >
                                    Change number
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    className="text-green-600 hover:underline"
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'profile' && (
                        <form onSubmit={handleCompleteProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    placeholder="Enter your age"
                                    min="18"
                                    max="120"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Select value={state} onValueChange={setState} disabled={loading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDIAN_STATES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="district">District</Label>
                                <Select 
                                    value={district} 
                                    onValueChange={setDistrict} 
                                    disabled={loading || !state || loadingDistricts}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            !state 
                                                ? "Select state first" 
                                                : loadingDistricts 
                                                ? "Loading districts..." 
                                                : "Select your district"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {districts.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                                {loading ? 'Saving...' : 'Complete Registration'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
