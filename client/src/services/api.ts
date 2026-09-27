import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const baseURL = configuredApiUrl
  ? `${configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`}`
  : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 unauthenticated and not on auth pages, redirect if necessary
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // Allow components / auth provider to handle redirection gracefully
      }
    }
    return Promise.reject(error);
  }
);
