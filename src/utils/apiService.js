
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Token storage keys
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ROLES_KEY = 'roles';

// Get token from storage
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// Set token in storage
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

// Remove token from storage
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Get user from storage
export const getUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

// Set user in storage
export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

// Remove user from storage
export const removeUser = () => localStorage.removeItem(USER_KEY);

// Get roles from storage
export const getRoles = () => {
  try {
    const roles = localStorage.getItem(ROLES_KEY);
    return roles ? JSON.parse(roles) : [];
  } catch {
    return [];
  }
};

// Set roles in storage
export const setRoles = (roles) => localStorage.setItem(ROLES_KEY, JSON.stringify(roles));

// Clear all auth data
export const clearAuthData = () => {
  removeToken();
  removeUser();
  localStorage.removeItem(ROLES_KEY);
  localStorage.removeItem('role');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Don't add token to auth endpoints (login, register, etc.)
    const isAuthEndpoint = config.url?.includes('/api/auth/login') ||
                          config.url?.includes('/api/auth/register') ||
                          config.url?.includes('/api/auth/forgot-password') ||
                          config.url?.includes('/api/auth/reset-password') ||
                          config.url?.includes('/api/auth/verify-email');

    if (!isAuthEndpoint) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          // Token expired or invalid - but don't logout for CORS preflight issues
          // Check if this is actually an auth error vs a network/CORS issue
          if (response.data && (
            typeof response.data === 'string' && (
              response.data.includes('Token') ||
              response.data.includes('expired') ||
              response.data.includes('revoked') ||
              response.data.includes('Authentication')
            )
          )) {
            clearAuthData();
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/LandingPage')) {
              window.location.href = '/LandingPage';
            }
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          // Error logged via error object returned to caller
          break;
        case 404:
          // Resource not found
          // Error logged via error object returned to caller
          break;
        case 500:
          // Server error
          // Error logged via error object returned to caller
          break;
        default:
          // Other API errors
          // Error logged via error object returned to caller
          break;
      }
    }
    // Network errors and other issues are passed through to caller

    return Promise.reject(error);
  }
);

// API Methods
const api = {
  // GET request
  get: async (url, config = {}) => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async (url, config = {}) => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  // Upload file (multipart/form-data)
  upload: async (url, formData, config = {}) => {
    const response = await apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download file (blob response)
  download: async (url, config = {}) => {
    const response = await apiClient.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Export the axios instance and api for direct use
export { apiClient, api };

export default api;
