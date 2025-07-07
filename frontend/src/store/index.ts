import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import teamSlice from './slices/teamSlice';
import channelSlice from './slices/channelSlice';
import messageSlice from './slices/messageSlice';
import websocketSlice from './slices/websocketSlice';
import notificationSlice from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    teams: teamSlice,
    channels: channelSlice,
    messages: messageSlice,
    websocket: websocketSlice,
    notifications: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 