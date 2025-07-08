/**
 * AI智能服务 - 前端API调用层
 * 调用后端AI功能接口，提供智能消息建议、自动摘要、语义搜索等功能
 */
import api from './api';

export interface MessageSuggestionRequest {
  channel_id: number;
  topic?: string;
  context?: string;
}

export interface MessageSuggestionResponse {
  suggestions: string[];
  confidence: number;
  context_used: number;
}

export interface AutoSummaryRequest {
  channel_id: number;
  start_time: string;
  end_time: string;
  summary_type?: string;
}

export interface AutoSummaryResponse {
  summary: string;
  key_points: string[];
  action_items: string[];
  participants: string[];
  message_count: number;
}

export interface SmartSearchRequest {
  query: string;
  channels?: number[];
  time_range?: {
    start: string;
    end: string;
  };
  search_type?: string;
}

export interface SearchResult {
  message_id: number;
  content: string;
  author: string;
  channel_name: string;
  timestamp: string;
  relevance_score: number;
  highlight?: string;
}

export interface SmartSearchResponse {
  results: SearchResult[];
  total_count: number;
  search_type: string;
  query_understanding: string;
  suggestions?: string[];
}

export interface AIConfig {
  enable_suggestions: boolean;
  enable_auto_summary: boolean;
  enable_smart_search: boolean;
  suggestion_sensitivity: number;
  language_preference: string;
}

export interface AIConfigResponse extends AIConfig {
  user_id: number;
  updated_at: string;
}

export interface ChannelAnalysisRequest {
  channel_id: number;
  analysis_type: string;
  time_range?: {
    start: string;
    end: string;
  };
}

export interface ChannelAnalysisResponse {
  channel_id: number;
  analysis_type: string;
  message_count: number;
  active_users: number;
  activity_level?: string;
  recommendations: string[];
}

export interface UserBehaviorAnalysisRequest {
  user_id?: number;
  time_range?: {
    start: string;
    end: string;
  };
}

export interface UserBehaviorAnalysisResponse {
  user_id: number;
  message_count: number;
  active_channels: number;
  communication_style: string;
  preferred_times: string[];
  collaboration_pattern: string;
  suggestions: string[];
}

export interface AITaskStatus {
  task_id: string;
  status: string;
  progress: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export class AIService {
  static async getMessageSuggestions(request: MessageSuggestionRequest): Promise<MessageSuggestionResponse> {
    try {
      const response = await api.post('/ai/suggestions', request);
      return response.data;
    } catch (error) {
      console.error('获取消息建议失败:', error);
      return {
        suggestions: [
          '好的，我明白了。',
          '谢谢分享！',
          '让我们继续讨论这个话题。'
        ],
        confidence: 0.3,
        context_used: 0
      };
    }
  }

  static async generateAutoSummary(request: AutoSummaryRequest): Promise<AutoSummaryResponse> {
    try {
      const response = await api.post('/ai/summary', request);
      return response.data;
    } catch (error) {
      console.error('生成自动摘要失败:', error);
      throw new Error('生成摘要失败，请稍后重试');
    }
  }

  static async intelligentSearch(request: SmartSearchRequest): Promise<SmartSearchResponse> {
    try {
      const response = await api.post('/ai/search', request);
      return response.data;
    } catch (error) {
      console.error('智能搜索失败:', error);
      throw new Error('搜索失败，请稍后重试');
    }
  }

  static async getAIConfig(): Promise<AIConfigResponse> {
    try {
      const response = await api.get('/ai/config');
      return response.data;
    } catch (error) {
      console.error('获取AI配置失败:', error);
      throw new Error('获取配置失败');
    }
  }

  static async updateAIConfig(config: AIConfig): Promise<AIConfigResponse> {
    try {
      const response = await api.put('/ai/config', config);
      return response.data;
    } catch (error) {
      console.error('更新AI配置失败:', error);
      throw new Error('更新配置失败');
    }
  }

  static formatTimeForAPI(date: Date): string {
    return date.toISOString();
  }

  static getDefaultTimeRange(): { start: string; end: string } {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      start: this.formatTimeForAPI(start),
      end: this.formatTimeForAPI(end)
    };
  }

  static getTimeRange(hours: number): { start: string; end: string } {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    
    return {
      start: this.formatTimeForAPI(start),
      end: this.formatTimeForAPI(end)
    };
  }

  static async healthCheck(): Promise<{
    status: string;
    features: Record<string, boolean>;
    llm_config: any;
    timestamp: string;
  }> {
    try {
      const response = await api.get('/ai/health');
      return response.data;
    } catch (error) {
      console.error('AI健康检查失败:', error);
      throw new Error('AI服务不可用');
    }
  }

  static async isAIAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }
} 