import { useQuery } from '@tanstack/react-query';
import { UserCategory } from '../types';
import { getToken } from '@clerk/react';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<UserCategory[]> => {
      const token = await getToken();
      const res = await fetch('/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
};
