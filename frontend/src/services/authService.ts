import api, { tokenManager } from './api';
import type { LoginRequest, RegisterRequest, AuthToken, User } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthToken> {
    const response = await api.post('/auth/login', credentials);
    const token = response.data.access_token;
    tokenManager.set(token);
    return response.data;
  },

  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.error('Logout failed:', error);
    } finally {
      tokenManager.remove();
    }
  },

  isAuthenticated(): boolean {
    return tokenManager.get() !== null;
  },
}; 