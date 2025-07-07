import { store } from '../store';
import { addMessage, updateMessageInState, removeMessageFromState } from '../store/slices/messageSlice';
import type { Message } from '../types';

export interface WebSocketMessage {
  type: 'message' | 'message_updated' | 'message_deleted' | 'user_typing' | 'user_online' | 'user_offline';
  data: any;
  channel_id?: number;
  user_id?: number;
  timestamp: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000; // 5秒重连间隔
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed: boolean = false;
  private currentChannelId: number | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  // 设置认证token
  setToken(token: string) {
    this.token = token;
  }

  // 连接WebSocket
  connect(channelId?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (!this.token) {
        reject(new Error('未提供认证token'));
        return;
      }

      this.isIntentionallyClosed = false;
      this.currentChannelId = channelId || null;

      // 构建WebSocket URL
      const wsUrl = this.buildWebSocketUrl();
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.reconnectAttempts = 0;
          this.clearReconnectTimer();
          
          // 如果指定了频道ID，加入频道
          if (channelId) {
            this.joinChannel(channelId);
          }
          
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭', event.code, event.reason);
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('WebSocket连接失败:', error);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    this.isIntentionallyClosed = true;
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, '用户主动断开连接');
      this.ws = null;
    }
  }

  // 发送消息
  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 加入频道
  joinChannel(channelId: number) {
    this.currentChannelId = channelId;
    this.send({
      type: 'user_online',
      data: { action: 'join_channel', channel_id: channelId },
      channel_id: channelId,
      timestamp: new Date().toISOString()
    });
  }

  // 离开频道
  leaveChannel(channelId: number) {
    this.send({
      type: 'user_offline',
      data: { action: 'leave_channel', channel_id: channelId },
      channel_id: channelId,
      timestamp: new Date().toISOString()
    });
    
    if (this.currentChannelId === channelId) {
      this.currentChannelId = null;
    }
  }

  // 发送正在输入状态
  sendTyping(channelId: number, isTyping: boolean) {
    this.send({
      type: 'user_typing',
      data: { is_typing: isTyping },
      channel_id: channelId,
      timestamp: new Date().toISOString()
    });
  }

  // 获取连接状态
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return this.reconnectTimer ? 'reconnecting' : 'disconnected';
      default:
        return 'disconnected';
    }
  }

  // 添加事件监听器
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // 移除事件监听器
  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // 触发事件
  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // 构建WebSocket URL
  private buildWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8000'; // 后端WebSocket端口
    
    return `${protocol}//${host}:${port}/ws?token=${this.token}`;
  }

  // 处理收到的消息
  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'message':
          // 新消息
          if (message.data) {
            store.dispatch(addMessage(message.data));
          }
          break;
          
        case 'message_updated':
          // 消息更新
          if (message.data) {
            store.dispatch(updateMessageInState(message.data));
          }
          break;
          
        case 'message_deleted':
          // 消息删除
          if (message.data?.message_id) {
            store.dispatch(removeMessageFromState(message.data.message_id));
          }
          break;
          
        case 'user_typing':
          // 用户正在输入
          this.emit('user_typing', message.data);
          break;
          
        case 'user_online':
          // 用户上线
          this.emit('user_online', message.data);
          break;
          
        case 'user_offline':
          // 用户下线
          this.emit('user_offline', message.data);
          break;
          
        default:
          console.warn('未知的WebSocket消息类型:', message.type);
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }

  // 安排重连
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('达到最大重连次数，停止重连');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // 指数退避
    
    console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连`);
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`开始第${this.reconnectAttempts}次重连`);
      this.connect(this.currentChannelId || undefined).catch(error => {
        console.error('重连失败:', error);
      });
    }, delay);
  }

  // 清除重连定时器
  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 设置事件监听器
  private setupEventListeners() {
    // 页面卸载时断开连接
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });

    // 页面可见性变化时管理连接
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，检查连接状态
        if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
          this.connect(this.currentChannelId || undefined).catch(console.error);
        }
      }
    });
  }
}

// 单例实例
export const websocketService = new WebSocketService();
export default websocketService; 