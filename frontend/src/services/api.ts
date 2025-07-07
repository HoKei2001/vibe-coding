import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiError } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
// 使用sessionStorage支持多标签页多用户测试
// 如果需要持久化登录，将USE_SESSION_STORAGE设为false
const USE_SESSION_STORAGE = true; // 开发时设为true，生产时设为false

const storage = USE_SESSION_STORAGE ? sessionStorage : localStorage;

export const tokenManager = {
  get: (): string | null => {
    return storage.getItem('token');
  },
  set: (token: string) => {
    storage.setItem('token', token);
  },
  remove: () => {
    storage.removeItem('token');
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 errors - token expired
    if (error.response?.status === 401) {
      tokenManager.remove();
      window.location.href = '/login';
    }
    
    // Format error response
    const apiError: ApiError = {
      detail: (error.response?.data as any)?.detail || error.message || 'An error occurred',
      status_code: error.response?.status || 500,
    };
    
    return Promise.reject(apiError);
  }
);

export default api; 