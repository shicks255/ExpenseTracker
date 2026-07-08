import { useQuery } from '@tanstack/react-query';
import { UserCategory } from '../types';
import { useAuth } from '@clerk/react';

export const useCategories = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['categories'],
    enabled: isLoaded && isSignedIn,
    queryFn: async (): Promise<UserCategory[]> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing Clerk session token');
      }

      const res = await fetch('/api/categories', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
};
