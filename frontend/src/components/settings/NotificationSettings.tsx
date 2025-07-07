import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  respondToInvitation,
  clearError 
} from '../../store/slices/notificationSlice';
import { 
  Bell, 
  Check, 
  X, 
  Trash2, 
  Users, 
  CheckCircle,
  Clock,
  UserPlus
} from 'lucide-react';
import type { Notification } from '../../types';

const NotificationSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading, error } = useAppSelector((state) => state.notifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    dispatch(fetchNotifications({ unreadOnly: filter === 'unread' }));
  }, [dispatch, filter]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleMarkAsRead = async (notificationId: number) => {
    await dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllNotificationsAsRead());
    if (filter === 'unread') {
      dispatch(fetchNotifications({ unreadOnly: true }));
    }
  };

  const handleDelete = async (notificationId: number) => {
    await dispatch(deleteNotification(notificationId));
  };

  const handleInviteResponse = async (notificationId: number, accepted: boolean) => {
    await dispatch(respondToInvitation({ notificationId, accepted }));
    // respondToInvitation内部已经会重新获取通知列表，但我们需要确保使用当前的筛选条件
    setTimeout(() => {
      dispatch(fetchNotifications({ unreadOnly: filter === 'unread' }));
    }, 100);
  };

  const getNotificationIcon = (type: string, data?: any) => {
    switch (type) {
      case 'team_invite':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'channel_invite':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'message_mention':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'system':
        // 根据系统通知的类型显示不同图标
        if (data?.response_type === 'team_invite_response') {
          return data?.accepted ? 
            <CheckCircle className="h-5 w-5 text-green-500" /> : 
            <X className="h-5 w-5 text-red-500" />;
        }
        if (data?.action_type === 'team_removal') {
          return <X className="h-5 w-5 text-red-500" />;
        }
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `${diffInDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    }
  };

  const renderNotification = (notification: Notification) => {
    const isInvite = notification.type === 'team_invite';
    const isProcessed = notification.is_read && isInvite && (
      notification.message.includes('已接受') || 
      notification.message.includes('已拒绝')
    );
    
    return (
      <div
        key={notification.id}
        className={`p-4 border rounded-lg ${
          notification.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type, notification.data)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h3>
              <div className="flex items-center space-x-2">
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="标记为已读"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTime(notification.created_at)}</span>
                {!notification.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
                {isProcessed && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    已处理
                  </span>
                )}
              </div>
              
              {isInvite && !isProcessed && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleInviteResponse(notification.id, false)}
                    className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleInviteResponse(notification.id, true)}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    接受
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">通知管理</h2>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-green-600 border border-green-300 rounded hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>全部已读</span>
              </button>
            )}
          </div>
        </div>
        
        {/* 筛选选项 */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            全部通知
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            未读通知
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 通知列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? '没有未读通知' : '暂无通知'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? '您已经查看了所有通知' 
                : '当您收到新通知时，它们会出现在这里'
              }
            </p>
          </div>
        ) : (
          notifications.map(renderNotification)
        )}
      </div>
    </div>
  );
};

export default NotificationSettings; 