import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface TypingUser {
  userId: number;
  username: string;
  channelId: number;
  timestamp: string;
}

interface OnlineUser {
  userId: number;
  username: string;
  channelId?: number;
  timestamp: string;
}

interface WebSocketState {
  connectionState: ConnectionState;
  reconnectAttempts: number;
  lastError: string | null;
  typingUsers: TypingUser[];
  onlineUsers: OnlineUser[];
  currentChannelId: number | null;
}

const initialState: WebSocketState = {
  connectionState: 'disconnected',
  reconnectAttempts: 0,
  lastError: null,
  typingUsers: [],
  onlineUsers: [],
  currentChannelId: null,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    // 连接状态管理
    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.connectionState = action.payload;
    },
    
    setReconnectAttempts: (state, action: PayloadAction<number>) => {
      state.reconnectAttempts = action.payload;
    },
    
    setLastError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    
    // 当前频道管理
    setCurrentChannelId: (state, action: PayloadAction<number | null>) => {
      state.currentChannelId = action.payload;
      // 切换频道时清除当前频道的输入状态
      if (action.payload !== null) {
        state.typingUsers = state.typingUsers.filter(
          user => user.channelId !== action.payload
        );
      }
    },
    
    // 正在输入状态管理
    addTypingUser: (state, action: PayloadAction<TypingUser>) => {
      const existingIndex = state.typingUsers.findIndex(
        user => user.userId === action.payload.userId && user.channelId === action.payload.channelId
      );
      
      if (existingIndex !== -1) {
        // 更新现有用户的时间戳
        state.typingUsers[existingIndex].timestamp = action.payload.timestamp;
      } else {
        // 添加新用户
        state.typingUsers.push(action.payload);
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<{ userId: number; channelId: number }>) => {
      state.typingUsers = state.typingUsers.filter(
        user => !(user.userId === action.payload.userId && user.channelId === action.payload.channelId)
      );
    },
    
    // 清除过期的输入状态（超过3秒）
    clearExpiredTypingUsers: (state) => {
      const now = new Date().getTime();
      const expireTime = 3000; // 3秒
      
      state.typingUsers = state.typingUsers.filter(user => {
        const userTime = new Date(user.timestamp).getTime();
        return now - userTime < expireTime;
      });
    },
    
    // 在线用户管理
    addOnlineUser: (state, action: PayloadAction<OnlineUser>) => {
      const existingIndex = state.onlineUsers.findIndex(
        user => user.userId === action.payload.userId
      );
      
      if (existingIndex !== -1) {
        // 更新现有用户信息
        state.onlineUsers[existingIndex] = action.payload;
      } else {
        // 添加新用户
        state.onlineUsers.push(action.payload);
      }
    },
    
    removeOnlineUser: (state, action: PayloadAction<number>) => {
      state.onlineUsers = state.onlineUsers.filter(
        user => user.userId !== action.payload
      );
    },
    
    updateOnlineUserChannel: (state, action: PayloadAction<{ userId: number; channelId: number | null }>) => {
      const user = state.onlineUsers.find(u => u.userId === action.payload.userId);
      if (user) {
        user.channelId = action.payload.channelId;
        user.timestamp = new Date().toISOString();
      }
    },
    
    // 重置状态
    reset: (state) => {
      state.connectionState = 'disconnected';
      state.reconnectAttempts = 0;
      state.lastError = null;
      state.typingUsers = [];
      state.onlineUsers = [];
      state.currentChannelId = null;
    },
  },
});

export const {
  setConnectionState,
  setReconnectAttempts,
  setLastError,
  setCurrentChannelId,
  addTypingUser,
  removeTypingUser,
  clearExpiredTypingUsers,
  addOnlineUser,
  removeOnlineUser,
  updateOnlineUserChannel,
  reset,
} = websocketSlice.actions;

export default websocketSlice.reducer; 