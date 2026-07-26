import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCategory } from '../types';
import { useAuth } from '@clerk/react';
const API_URL = import.meta.env.EXPENSE_API_BASE;

export const usePostCategory = () => {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (category: string): Promise<UserCategory> => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken({ skipCache: true });
      const res = await fetch(`${API_URL}/api/categories/${category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to post category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categories'],
      });
    },
  });
};

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

      const res = await fetch(`${API_URL}/api/categories`, {
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
