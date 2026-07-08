import { useAuth } from '@clerk/clerk-react';

export const useApi = () => {
  const { getToken } = useAuth();

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { apiFetch };
};
