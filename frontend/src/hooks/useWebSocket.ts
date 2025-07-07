import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { websocketService } from '../services/websocketService';
import {
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
} from '../store/slices/websocketSlice';

export const useWebSocket = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { connectionState, currentChannelId } = useAppSelector((state) => state.websocket);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersSetup = useRef(false);

  // 设置WebSocket事件监听器
  const setupEventListeners = useCallback(() => {
    if (eventListenersSetup.current) return;

    websocketService.on('connected', () => {
      dispatch(setConnectionState('connected'));
      dispatch(setReconnectAttempts(0));
      dispatch(setLastError(null));
    });

    websocketService.on('disconnected', (data: { code: number; reason: string }) => {
      dispatch(setConnectionState('disconnected'));
      dispatch(setLastError(data.reason || '连接断开'));
    });

    websocketService.on('error', (error: any) => {
      dispatch(setLastError(error.message || '连接错误'));
    });

    websocketService.on('max_reconnect_attempts_reached', () => {
      dispatch(setLastError('达到最大重连次数'));
    });

    websocketService.on('user_typing', (data: any) => {
      if (data.is_typing) {
        dispatch(addTypingUser({
          userId: data.user_id,
          username: data.username,
          channelId: data.channel_id,
          timestamp: new Date().toISOString()
        }));
      } else {
        dispatch(removeTypingUser({
          userId: data.user_id,
          channelId: data.channel_id
        }));
      }
    });

    websocketService.on('user_online', (data: any) => {
      if (data.action === 'join_channel') {
        dispatch(addOnlineUser({
          userId: data.user_id,
          username: data.username,
          channelId: data.channel_id,
          timestamp: new Date().toISOString()
        }));
      } else {
        dispatch(addOnlineUser({
          userId: data.user_id,
          username: data.username,
          timestamp: new Date().toISOString()
        }));
      }
    });

    websocketService.on('user_offline', (data: any) => {
      if (data.action === 'leave_channel') {
        dispatch(updateOnlineUserChannel({
          userId: data.user_id,
          channelId: null
        }));
      } else {
        dispatch(removeOnlineUser(data.user_id));
      }
    });

    eventListenersSetup.current = true;
  }, [dispatch]);

  // 连接WebSocket
  const connect = useCallback(async (channelId?: number) => {
    if (!token) {
      dispatch(setLastError('未提供认证token'));
      return;
    }

    try {
      dispatch(setConnectionState('connecting'));
      websocketService.setToken(token);
      await websocketService.connect(channelId);
      
      if (channelId) {
        dispatch(setCurrentChannelId(channelId));
      }
    } catch (error) {
      dispatch(setConnectionState('disconnected'));
      dispatch(setLastError(error instanceof Error ? error.message : '连接失败'));
    }
  }, [token, dispatch]);

  // 断开连接
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    dispatch(reset());
  }, [dispatch]);

  // 加入频道
  const joinChannel = useCallback((channelId: number) => {
    websocketService.joinChannel(channelId);
    dispatch(setCurrentChannelId(channelId));
  }, [dispatch]);

  // 离开频道
  const leaveChannel = useCallback((channelId: number) => {
    websocketService.leaveChannel(channelId);
    if (currentChannelId === channelId) {
      dispatch(setCurrentChannelId(null));
    }
  }, [currentChannelId, dispatch]);

  // 发送正在输入状态
  const sendTyping = useCallback((channelId: number, isTyping: boolean) => {
    websocketService.sendTyping(channelId, isTyping);
  }, []);

  // 开始输入（带自动停止）
  const startTyping = useCallback((channelId: number) => {
    // 清除之前的定时器
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // 发送正在输入状态
    sendTyping(channelId, true);

    // 设置自动停止输入状态（3秒后）
    typingTimerRef.current = setTimeout(() => {
      sendTyping(channelId, false);
    }, 3000);
  }, [sendTyping]);

  // 停止输入
  const stopTyping = useCallback((channelId: number) => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    sendTyping(channelId, false);
  }, [sendTyping]);

  // 获取连接状态
  const getConnectionState = useCallback(() => {
    return websocketService.getConnectionState();
  }, []);

  // 设置事件监听器
  useEffect(() => {
    setupEventListeners();
  }, [setupEventListeners]);

  // 定期清除过期的输入状态
  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(clearExpiredTypingUsers());
    }, 5000); // 每5秒清除一次

    return () => clearInterval(timer);
  }, [dispatch]);

  // 页面卸载时清理
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping,
    getConnectionState,
  };
};

export default useWebSocket; 