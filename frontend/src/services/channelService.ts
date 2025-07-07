import api from './api';
import type { 
  Channel, 
  ChannelMember, 
  CreateChannelRequest 
} from '../types';

export const channelService = {
  // 获取团队频道列表
  async getTeamChannels(teamId: number, includeArchived: boolean = false): Promise<Channel[]> {
    const response = await api.get(`/channels?team_id=${teamId}&include_archived=${includeArchived}`);
    return response.data;
  },

  // 获取用户参与的频道列表
  async getUserChannels(): Promise<Channel[]> {
    const response = await api.get('/channels');
    return response.data;
  },

  // 根据ID获取频道详情
  async getChannelById(channelId: number): Promise<Channel> {
    const response = await api.get(`/channels/${channelId}`);
    return response.data;
  },

  // 创建新频道
  async createChannel(channelData: CreateChannelRequest): Promise<Channel> {
    const response = await api.post('/channels', channelData);
    return response.data;
  },

  // 更新频道信息
  async updateChannel(channelId: number, channelData: Partial<CreateChannelRequest>): Promise<Channel> {
    const response = await api.put(`/channels/${channelId}`, channelData);
    return response.data;
  },

  // 归档频道
  async archiveChannel(channelId: number): Promise<void> {
    await api.post(`/channels/${channelId}/archive`);
  },

  // 删除频道
  async deleteChannel(channelId: number): Promise<void> {
    await api.delete(`/channels/${channelId}`);
  },

  // 获取频道成员列表
  async getChannelMembers(channelId: number): Promise<ChannelMember[]> {
    const response = await api.get(`/channels/${channelId}/members`);
    return response.data;
  },

  // 添加频道成员
  async addChannelMember(channelId: number, userId: number, role: 'admin' | 'member' = 'member'): Promise<ChannelMember> {
    const response = await api.post(`/channels/${channelId}/members`, {
      user_id: userId,
      role: role
    });
    return response.data;
  },

  // 更新频道成员角色
  async updateChannelMemberRole(channelId: number, userId: number, role: 'admin' | 'member'): Promise<ChannelMember> {
    const response = await api.put(`/channels/${channelId}/members/${userId}`, {
      role: role
    });
    return response.data;
  },

  // 移除频道成员
  async removeChannelMember(channelId: number, userId: number): Promise<void> {
    await api.delete(`/channels/${channelId}/members/${userId}`);
  },

  // 搜索频道
  async searchChannels(teamId: number, query: string): Promise<Channel[]> {
    const response = await api.get(`/channels/team/${teamId}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 获取频道统计信息
  async getChannelStats(channelId: number): Promise<{
    member_count: number;
    message_count: number;
  }> {
    const response = await api.get(`/channels/${channelId}/stats`);
    return response.data;
  },

  // 加入频道
  async joinChannel(channelId: number): Promise<ChannelMember> {
    const response = await api.post(`/channels/${channelId}/join`);
    return response.data;
  },

  // 离开频道
  async leaveChannel(channelId: number): Promise<void> {
    await api.post(`/channels/${channelId}/leave`);
  }
};

export default channelService; 