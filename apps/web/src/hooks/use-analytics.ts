'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AnalyticsData } from '@/types/analytics';

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => api.get<AnalyticsData>('/analytics').then((r) => r.data),
    staleTime: 30_000,
    retry: false,
  });
}
