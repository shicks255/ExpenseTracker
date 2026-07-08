import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../types';
import { useAuth } from '@clerk/react';

interface IExpenseFilter {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  size?: number;
  categoryIds?: number[];
  vendor?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

const buildQueryParams = (filter: IExpenseFilter) => {
  const params = new URLSearchParams();
  params.append('sortBy', filter.sortBy);
  params.append('sortDirection', filter.sortDirection);
  if (filter.categoryIds !== undefined) {
    filter.categoryIds.forEach((id) => {
      params.append('categoryIds', id.toString());
    });
  }
  if (filter.dateRange) {
    params.append('from', filter.dateRange.from);
    params.append('to', filter.dateRange.to);
  }
  if (filter.vendor) {
    params.append('vendor', filter.vendor);
  }
  if (filter.size) {
    params.append('size', filter.size.toString());
  }
  return params.toString();
};

export const useExpenses = (filter: IExpenseFilter) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['expenses', filter],
    enabled: isLoaded && isSignedIn,
    queryFn: async (): Promise<Expense[]> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing Clerk session token');
      }

      const qp = filter ? `?${buildQueryParams(filter)}` : '';
      const res = await fetch(`/api/expenses${qp}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (expense: {
      date: string;
      amount: number;
      vendor: string;
      category_id: number;
    }): Promise<Expense> => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken({ skipCache: true });
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expense),
      });
      if (!res.ok) throw new Error('Failed to create expense');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken({ skipCache: true });
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete expense');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};
