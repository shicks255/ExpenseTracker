import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';

interface ReportRequest {
  aggregation: 'daily' | 'weekly' | 'monthly' | 'yearly';
  groupBy: 'category' | 'vendor';
  from: string;
  to: string;
}

export const useReports = (req: ReportRequest) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['reports', req],
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing Clerk session token');
      }

      const res = await fetch('/api/reporting', {
        body: JSON.stringify(req),
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });
};
