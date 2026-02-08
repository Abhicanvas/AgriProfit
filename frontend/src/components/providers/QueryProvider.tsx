'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 0, // Data is immediately considered stale
                cacheTime: 0, // Don't keep data in cache
                refetchOnMount: 'always', // Always refetch on component mount
                refetchOnWindowFocus: true, // Refetch when user returns to tab
                refetchOnReconnect: true, // Refetch when reconnecting to internet
                refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time data
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
