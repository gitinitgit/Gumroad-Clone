import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Set up the Clerk token interceptor.
 * Call this once from the root component after Clerk is loaded.
 */
export const setAuthInterceptor = (getToken: () => Promise<string | null>) => {
  api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // No token available — request will be unauthenticated
    }
    return config;
  });
};

export default api;
