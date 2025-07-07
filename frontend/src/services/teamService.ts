import api from './api';
import type { 
  Team, 
  TeamMember, 
  CreateTeamRequest, 
  User 
} from '../types';

export const teamService = {
  // 获取用户所在的团队列表
  async getUserTeams(): Promise<Team[]> {
    const response = await api.get('/teams');
    return response.data;
  },

  // 获取公开团队列表
  async getPublicTeams(): Promise<Team[]> {
    const response = await api.get('/teams?public_only=true');
    return response.data;
  },

  // 根据ID获取团队详情
  async getTeamById(teamId: number): Promise<Team> {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  // 创建新团队
  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // 更新团队信息
  async updateTeam(teamId: number, teamData: Partial<CreateTeamRequest>): Promise<Team> {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },

  // 删除团队
  async deleteTeam(teamId: number): Promise<void> {
    await api.delete(`/teams/${teamId}`);
  },

  // 获取团队成员列表
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  // 添加团队成员
  async addTeamMember(teamId: number, userId: number, role: 'admin' | 'member' | 'guest' = 'member'): Promise<{message: string}> {
    const response = await api.post(`/teams/${teamId}/members`, {
      user_id: userId,
      role: role
    });
    return response.data;
  },

  // 更新团队成员角色
  async updateTeamMemberRole(teamId: number, memberId: number, role: 'admin' | 'member' | 'guest'): Promise<TeamMember> {
    const response = await api.put(`/teams/${teamId}/members/${memberId}`, {
      role: role
    });
    return response.data;
  },

  // 移除团队成员
  async removeTeamMember(teamId: number, memberId: number): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${memberId}`);
  },

  // 搜索团队
  async searchTeams(query: string): Promise<Team[]> {
    const response = await api.get(`/teams/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 获取团队统计信息
  async getTeamStats(teamId: number): Promise<{
    member_count: number;
    channel_count: number;
    message_count: number;
  }> {
    const response = await api.get(`/teams/${teamId}/stats`);
    return response.data;
  },

  // 邀请用户加入团队（通过邮箱）
  async inviteUserByEmail(teamId: number, email: string, role: 'admin' | 'member' | 'guest' = 'member'): Promise<void> {
    await api.post(`/teams/${teamId}/invite`, {
      email: email,
      role: role
    });
  },

  // 离开团队
  async leaveTeam(teamId: number): Promise<void> {
    await api.post(`/teams/${teamId}/leave`);
  }
};

export default teamService; 