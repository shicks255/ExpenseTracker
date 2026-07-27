import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { Expense, ExpensesResult, UpdateExpense } from '../types';
import { useAuth } from '@clerk/react';
const API_URL = import.meta.env.VITE_EXPENSE_API_BASE;

interface IExpenseFilter {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  pageSize?: number;
  pageNumber?: number;
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
  if (filter.pageSize) {
    params.append('pageSize', filter.pageSize.toString());
  } else {
    params.append('pageSize', '249');
  }
  if (filter.pageNumber) {
    params.append('pageNumber', filter.pageNumber.toString());
  }
  return params.toString();
};

export const useUpdateVendor = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (body: { oldVendor: string; newVendor: string }) => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken({ skipCache: true });
      const res = await fetch(`${API_URL}/api/expenses/vendor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update vendor');
    },
  });
};

export const useExpenseVendors = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['expenseVendors'],
    enabled: isLoaded && isSignedIn,
    queryFn: async (): Promise<string[]> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing Clerk session token');
      }

      const res = await fetch(`${API_URL}/api/expenses/vendors`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch expense vendors');
      return res.json();
    },
  });
};

export const useInifiniteExpenses = (filter: IExpenseFilter) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // const [page, setPage] = useState(initPage);

  return useInfiniteQuery({
    queryKey: ['infiniteExpenses', filter],
    initialPageParam: filter.pageNumber,
    enabled: isLoaded && isSignedIn,
    queryFn: async ({ pageParam }): Promise<ExpensesResult> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing clerk session token');
      }

      const paramWithPage = {
        ...filter,
        pageNumber: pageParam,
      };

      const qp = paramWithPage ? `?${buildQueryParams(paramWithPage)}` : '';
      const res = await fetch(`${API_URL}/api/expenses${qp}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const r = res.json();
      console.log(r);
      return r;
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (lastPage.hasMore) {
        return lastPageParam! + 1;
      }
      return undefined;
    },
  });
};

export const useExpenses = (filter: IExpenseFilter) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['expenses', filter],
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<ExpensesResult> => {
      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error('Missing Clerk session token');
      }

      const qp = filter ? `?${buildQueryParams(filter)}` : '';
      const res = await fetch(`${API_URL}/api/expenses${qp}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const r = res.json();
      console.log(r);
      return r;
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (updatedExpense: UpdateExpense): Promise<Expense> => {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Not authenticated');
      }

      const token = await getToken({ skipCache: true });
      const id = updatedExpense.id;
      delete updatedExpense.id; // Remove the id from the body since it's part of the URL
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedExpense),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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
      const res = await fetch(`${API_URL}/api/expenses`, {
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
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
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
