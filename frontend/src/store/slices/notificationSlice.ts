import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notificationService';
import type { Notification, ApiError } from '../../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// 异步操作
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ unreadOnly = false, skip = 0, limit = 50 }: { unreadOnly?: boolean; skip?: number; limit?: number }, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(unreadOnly, skip, limit);
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getUnreadCount();
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      const notification = await notificationService.markAsRead(notificationId);
      return notification;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: number, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

export const respondToInvitation = createAsyncThunk(
  'notifications/respondToInvitation',
  async ({ notificationId, accepted }: { notificationId: number; accepted: boolean }, { dispatch, rejectWithValue }) => {
    try {
      await notificationService.respondToInvitation(notificationId, accepted);
      // 响应邀请成功后，重新获取通知列表以显示最新状态
      dispatch(fetchNotifications({ unreadOnly: false }));
      dispatch(fetchUnreadCount());
      return { notificationId, accepted };
    } catch (error) {
      return rejectWithValue((error as ApiError).detail);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.id);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.is_read = true;
        });
        state.unreadCount = 0;
      })
      
      // deleteNotification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationIndex = state.notifications.findIndex(n => n.id === action.payload);
        if (notificationIndex !== -1) {
          const notification = state.notifications[notificationIndex];
          if (!notification.is_read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(notificationIndex, 1);
        }
      })
      
      // respondToInvitation
      .addCase(respondToInvitation.fulfilled, (state, action) => {
        // 不需要在这里修改本地状态，因为我们会重新获取通知列表
        // 这样可以确保显示后端更新后的最新状态
      });
  },
});

export const { clearError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer; 