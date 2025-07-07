import api from './api';
import type { User, ApiError, UpdateUserRequest } from '../types';

export const userService = {
  // 更新用户资料
  async updateProfile(userId: number, userData: UpdateUserRequest): Promise<User> {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // 获取用户信息
  async getUserById(userId: number): Promise<User> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // 设置在线状态
  async setOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await api.post(`/users/${userId}/online`, { is_online: isOnline });
  },

  // 搜索用户
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const response = await api.get(`/users/search`, {
      params: { q: query, limit }
    });
    return response.data;
  },
}; 