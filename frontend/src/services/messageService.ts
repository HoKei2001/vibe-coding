import api from './api';
import type { 
  Message, 
  SendMessageRequest 
} from '../types';

export const messageService = {
  // 获取频道消息历史
  async getChannelMessages(
    channelId: number, 
    skip: number = 0, 
    limit: number = 50,
    beforeMessageId?: number,
    afterMessageId?: number
  ): Promise<Message[]> {
    const params = new URLSearchParams({
      channel_id: channelId.toString(),
      skip: skip.toString(),
      limit: limit.toString()
    });
    
    if (beforeMessageId) {
      params.append('before_message_id', beforeMessageId.toString());
    }
    if (afterMessageId) {
      params.append('after_message_id', afterMessageId.toString());
    }

    const response = await api.get(`/messages?${params.toString()}`);
    return response.data;
  },

  // 发送消息
  async sendMessage(channelId: number, messageData: SendMessageRequest): Promise<Message> {
    const response = await api.post('/messages', {
      ...messageData,
      channel_id: channelId
    });
    return response.data;
  },

  // 获取消息详情
  async getMessageById(messageId: number): Promise<Message> {
    const response = await api.get(`/messages/${messageId}`);
    return response.data;
  },

  // 编辑消息
  async updateMessage(messageId: number, content: string): Promise<Message> {
    const response = await api.put(`/messages/${messageId}`, {
      content: content
    });
    return response.data;
  },

  // 删除消息
  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  // 获取消息回复
  async getMessageReplies(messageId: number): Promise<Message[]> {
    const response = await api.get(`/messages/${messageId}/replies`);
    return response.data;
  },

  // 搜索消息
  async searchMessages(
    query: string, 
    channelId?: number, 
    teamId?: number, 
    limit: number = 20
  ): Promise<Message[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString()
    });
    
    if (channelId) {
      params.append('channel_id', channelId.toString());
    }
    if (teamId) {
      params.append('team_id', teamId.toString());
    }

    const response = await api.get(`/messages/search?${params.toString()}`);
    return response.data;
  },

  // 获取用户提及
  async getUserMentions(skip: number = 0, limit: number = 50): Promise<Message[]> {
    const response = await api.get(`/messages/mentions?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // 标记消息为已读
  async markMessagesAsRead(channelId: number, lastReadMessageId: number): Promise<void> {
    await api.post(`/messages/channel/${channelId}/mark-read`, {
      last_read_message_id: lastReadMessageId
    });
  }
};

export default messageService; 