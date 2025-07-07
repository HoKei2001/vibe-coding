import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { channelService } from '../../services/channelService';
import type { 
  Channel, 
  ChannelMember, 
  CreateChannelRequest, 
  ApiError 
} from '../../types';

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  channelMembers: ChannelMember[];
  userChannels: Channel[];
  isLoading: boolean;
  error: string | null;
  channelStats: {
    member_count: number;
    message_count: number;
  } | null;
}

const initialState: ChannelState = {
  channels: [],
  currentChannel: null,
  channelMembers: [],
  userChannels: [],
  isLoading: false,
  error: null,
  channelStats: null,
};

// 异步actions
export const getTeamChannels = createAsyncThunk(
  'channels/getTeamChannels',
  async ({ teamId, includeArchived = false }: { teamId: number; includeArchived?: boolean }, { rejectWithValue }) => {
    try {
      const channels = await channelService.getTeamChannels(teamId, includeArchived);
      return channels;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getUserChannels = createAsyncThunk(
  'channels/getUserChannels',
  async (_, { rejectWithValue }) => {
    try {
      const channels = await channelService.getUserChannels();
      return channels;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getChannelById = createAsyncThunk(
  'channels/getChannelById',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const channel = await channelService.getChannelById(channelId);
      return channel;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const createChannel = createAsyncThunk(
  'channels/createChannel',
  async (channelData: CreateChannelRequest, { rejectWithValue }) => {
    try {
      const channel = await channelService.createChannel(channelData);
      return channel;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const updateChannel = createAsyncThunk(
  'channels/updateChannel',
  async ({ channelId, channelData }: { channelId: number; channelData: Partial<CreateChannelRequest> }, { rejectWithValue }) => {
    try {
      const channel = await channelService.updateChannel(channelId, channelData);
      return channel;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const archiveChannel = createAsyncThunk(
  'channels/archiveChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      await channelService.archiveChannel(channelId);
      return channelId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const deleteChannel = createAsyncThunk(
  'channels/deleteChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      await channelService.deleteChannel(channelId);
      return channelId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getChannelMembers = createAsyncThunk(
  'channels/getChannelMembers',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const members = await channelService.getChannelMembers(channelId);
      return members;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const addChannelMember = createAsyncThunk(
  'channels/addChannelMember',
  async ({ channelId, userId, role }: { channelId: number; userId: number; role?: 'admin' | 'member' }, { rejectWithValue }) => {
    try {
      const member = await channelService.addChannelMember(channelId, userId, role);
      return member;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const removeChannelMember = createAsyncThunk(
  'channels/removeChannelMember',
  async ({ channelId, userId }: { channelId: number; userId: number }, { rejectWithValue }) => {
    try {
      await channelService.removeChannelMember(channelId, userId);
      return userId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const joinChannel = createAsyncThunk(
  'channels/joinChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const member = await channelService.joinChannel(channelId);
      return member;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const leaveChannel = createAsyncThunk(
  'channels/leaveChannel',
  async (channelId: number, { rejectWithValue }) => {
    try {
      await channelService.leaveChannel(channelId);
      return channelId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const searchChannels = createAsyncThunk(
  'channels/searchChannels',
  async ({ teamId, query }: { teamId: number; query: string }, { rejectWithValue }) => {
    try {
      const channels = await channelService.searchChannels(teamId, query);
      return channels;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const getChannelStats = createAsyncThunk(
  'channels/getChannelStats',
  async (channelId: number, { rejectWithValue }) => {
    try {
      const stats = await channelService.getChannelStats(channelId);
      return stats;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

const channelSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
    clearCurrentChannel: (state) => {
      state.currentChannel = null;
      state.channelMembers = [];
      state.channelStats = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取团队频道
      .addCase(getTeamChannels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTeamChannels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channels = action.payload;
      })
      .addCase(getTeamChannels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取用户频道
      .addCase(getUserChannels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserChannels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userChannels = action.payload;
      })
      .addCase(getUserChannels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取频道详情
      .addCase(getChannelById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChannelById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChannel = action.payload;
      })
      .addCase(getChannelById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 创建频道
      .addCase(createChannel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channels.push(action.payload);
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 更新频道
      .addCase(updateChannel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateChannel.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.channels.findIndex(channel => channel.id === action.payload.id);
        if (index !== -1) {
          state.channels[index] = action.payload;
        }
        if (state.currentChannel?.id === action.payload.id) {
          state.currentChannel = action.payload;
        }
      })
      .addCase(updateChannel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 归档频道
      .addCase(archiveChannel.fulfilled, (state, action) => {
        const channelId = action.payload;
        const channel = state.channels.find(c => c.id === channelId);
        if (channel) {
          channel.is_archived = true;
        }
      })
      // 删除频道
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.channels = state.channels.filter(channel => channel.id !== action.payload);
        if (state.currentChannel?.id === action.payload) {
          state.currentChannel = null;
        }
      })
      // 获取频道成员
      .addCase(getChannelMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getChannelMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channelMembers = action.payload;
      })
      .addCase(getChannelMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 添加频道成员
      .addCase(addChannelMember.fulfilled, (state, action) => {
        state.channelMembers.push(action.payload);
      })
      // 移除频道成员
      .addCase(removeChannelMember.fulfilled, (state, action) => {
        state.channelMembers = state.channelMembers.filter(member => member.user.id !== action.payload);
      })
      // 加入频道
      .addCase(joinChannel.fulfilled, (state, action) => {
        state.channelMembers.push(action.payload);
      })
      // 离开频道
      .addCase(leaveChannel.fulfilled, (state, action) => {
        const channelId = action.payload;
        // 从频道列表中移除当前用户
        state.channelMembers = state.channelMembers.filter(member => member.channel?.id !== channelId);
      })
      // 搜索频道
      .addCase(searchChannels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchChannels.fulfilled, (state, action) => {
        state.isLoading = false;
        // 搜索结果可以放到单独的状态中，这里暂时放在channels中
        state.channels = action.payload;
      })
      .addCase(searchChannels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取频道统计
      .addCase(getChannelStats.fulfilled, (state, action) => {
        state.channelStats = action.payload;
      });
  },
});

export const { clearError, setCurrentChannel, clearCurrentChannel } = channelSlice.actions;
export default channelSlice.reducer; 