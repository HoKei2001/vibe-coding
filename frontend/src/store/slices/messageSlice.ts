import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageService } from '../../services/messageService';
import type { 
  Message, 
  SendMessageRequest, 
  ApiError 
} from '../../types';

interface MessageState {
  messages: Message[];
  currentMessages: Message[];  // 当前频道的消息
  isLoading: boolean;
  error: string | null;
  sendingMessage: boolean;
  hasMore: boolean;  // 是否还有更多消息
  currentChannelId: number | null;
}

const initialState: MessageState = {
  messages: [],
  currentMessages: [],
  isLoading: false,
  error: null,
  sendingMessage: false,
  hasMore: true,
  currentChannelId: null,
};

// 异步actions
export const getChannelMessages = createAsyncThunk(
  'messages/getChannelMessages',
  async (
    { 
      channelId, 
      skip = 0, 
      limit = 50, 
      beforeMessageId, 
      afterMessageId 
    }: { 
      channelId: number; 
      skip?: number; 
      limit?: number; 
      beforeMessageId?: number; 
      afterMessageId?: number; 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const messages = await messageService.getChannelMessages(
        channelId, 
        skip, 
        limit, 
        beforeMessageId, 
        afterMessageId
      );
      return { messages, channelId, isLoadMore: skip > 0 || !!beforeMessageId };
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (
    { channelId, messageData }: { channelId: number; messageData: SendMessageRequest }, 
    { rejectWithValue }
  ) => {
    try {
      const message = await messageService.sendMessage(channelId, messageData);
      return message;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const updateMessage = createAsyncThunk(
  'messages/updateMessage',
  async (
    { messageId, content }: { messageId: number; content: string }, 
    { rejectWithValue }
  ) => {
    try {
      const message = await messageService.updateMessage(messageId, content);
      return message;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId: number, { rejectWithValue }) => {
    try {
      await messageService.deleteMessage(messageId);
      return messageId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getMessageReplies = createAsyncThunk(
  'messages/getMessageReplies',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const replies = await messageService.getMessageReplies(messageId);
      return { messageId, replies };
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const searchMessages = createAsyncThunk(
  'messages/searchMessages',
  async (
    { 
      query, 
      channelId, 
      teamId, 
      limit = 20 
    }: { 
      query: string; 
      channelId?: number; 
      teamId?: number; 
      limit?: number; 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const messages = await messageService.searchMessages(query, channelId, teamId, limit);
      return messages;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'messages/markMessagesAsRead',
  async (
    { channelId, lastReadMessageId }: { channelId: number; lastReadMessageId: number }, 
    { rejectWithValue }
  ) => {
    try {
      await messageService.markMessagesAsRead(channelId, lastReadMessageId);
      return { channelId, lastReadMessageId };
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentMessages = [];
      state.currentChannelId = null;
      state.hasMore = true;
    },
    setCurrentChannel: (state, action) => {
      state.currentChannelId = action.payload;
      state.currentMessages = [];
      state.hasMore = true;
    },
    // 实时添加新消息（WebSocket使用）
    addMessage: (state, action) => {
      const message = action.payload;
      if (message.channel_id === state.currentChannelId) {
        // 检查消息是否已存在
        const exists = state.currentMessages.some(m => m.id === message.id);
        if (!exists) {
          state.currentMessages.push(message);
          // 按时间排序
          state.currentMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      }
    },
    // 更新消息（编辑时使用）
    updateMessageInState: (state, action) => {
      const updatedMessage = action.payload;
      const index = state.currentMessages.findIndex(m => m.id === updatedMessage.id);
      if (index !== -1) {
        state.currentMessages[index] = updatedMessage;
      }
    },
    // 移除消息（删除时使用）
    removeMessageFromState: (state, action) => {
      const messageId = action.payload;
      state.currentMessages = state.currentMessages.filter(m => m.id !== messageId);
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取频道消息
      .addCase(getChannelMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChannelMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        const { messages, channelId, isLoadMore } = action.payload;
        
        if (channelId !== state.currentChannelId) {
          // 切换频道，重置消息
          state.currentChannelId = channelId;
          state.currentMessages = messages;
        } else if (isLoadMore) {
          // 加载更多消息，添加到现有消息前面
          state.currentMessages = [...messages, ...state.currentMessages];
        } else {
          // 初始加载或刷新
          state.currentMessages = messages;
        }
        
        // 更新hasMore状态
        state.hasMore = messages.length >= 50; // 假设limit为50
        
        // 按时间排序
        state.currentMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      })
      .addCase(getChannelMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 发送消息
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const message = action.payload;
        
        // 如果是当前频道的消息，添加到列表中
        if (message.channel_id === state.currentChannelId) {
          // 检查消息是否已存在（避免重复）
          const exists = state.currentMessages.some(m => m.id === message.id);
          if (!exists) {
            state.currentMessages.push(message);
            // 重新排序
            state.currentMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload as string;
      })
      // 更新消息
      .addCase(updateMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const index = state.currentMessages.findIndex(m => m.id === updatedMessage.id);
        if (index !== -1) {
          state.currentMessages[index] = updatedMessage;
        }
      })
      // 删除消息
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        state.currentMessages = state.currentMessages.filter(m => m.id !== messageId);
      })
      // 获取消息回复
      .addCase(getMessageReplies.fulfilled, (state, action) => {
        const { messageId, replies } = action.payload;
        const messageIndex = state.currentMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          state.currentMessages[messageIndex].replies = replies;
        }
      })
      // 搜索消息
      .addCase(searchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearMessages, 
  setCurrentChannel,
  addMessage,
  updateMessageInState,
  removeMessageFromState
} = messageSlice.actions;

export default messageSlice.reducer; 