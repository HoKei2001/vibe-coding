import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getChannelById } from '../../store/slices/channelSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import ConnectionStatus from '../common/ConnectionStatus';
import { 
  Hash, 
  Lock, 
  Users, 
  Settings, 
  Search,
  Pin,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { Message, Channel } from '../../types';

const ChatInterface: React.FC = () => {
  const { teamId, channelId } = useParams<{ teamId: string; channelId: string }>();
  const dispatch = useAppDispatch();
  const { currentChannel, isLoading } = useAppSelector((state) => state.channels);
  const { currentTeam } = useAppSelector((state) => state.teams);
  const { connectionState } = useAppSelector((state) => state.websocket);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  
  // WebSocket hook
  const { connect, disconnect, joinChannel, leaveChannel } = useWebSocket();

  const numericChannelId = channelId ? parseInt(channelId) : null;

  useEffect(() => {
    if (numericChannelId) {
      dispatch(getChannelById(numericChannelId));
    }
  }, [numericChannelId, dispatch]);

  // WebSocket连接管理
  useEffect(() => {
    if (numericChannelId) {
      // 连接到WebSocket并加入频道
      connect(numericChannelId);
      
      return () => {
        // 组件卸载时离开频道
        leaveChannel(numericChannelId);
      };
    }
  }, [numericChannelId, connect, leaveChannel]);

  // 频道切换时的处理
  useEffect(() => {
    if (numericChannelId && connectionState === 'connected') {
      joinChannel(numericChannelId);
    }
  }, [numericChannelId, connectionState, joinChannel]);

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'direct':
        return <Users className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatMemberCount = (count: number) => {
    if (count === 1) return '1 人';
    return `${count} 人`;
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'connecting':
      case 'reconnecting':
        return <Wifi className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected':
        return '实时连接已建立';
      case 'connecting':
        return '正在连接...';
      case 'reconnecting':
        return '重新连接中...';
      default:
        return '连接断开';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载频道信息...</p>
        </div>
      </div>
    );
  }

  if (!currentChannel || !numericChannelId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            找不到频道
          </h3>
          <p className="text-gray-500">
            请检查频道链接是否正确，或联系管理员。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 连接状态指示器 */}
      <ConnectionStatus />

      {/* 频道头部 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 频道信息 */}
            <div className="flex items-center space-x-2">
              <div className="text-gray-600">
                {getChannelIcon(currentChannel)}
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentChannel.name}
              </h1>
              {currentChannel.is_archived && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  已归档
                </span>
              )}
              
              {/* 连接状态 */}
              <div className="flex items-center space-x-1" title={getConnectionText()}>
                {getConnectionIcon()}
              </div>
            </div>

            {/* 频道描述 */}
            {currentChannel.description && (
              <div className="text-sm text-gray-500 max-w-md truncate">
                {currentChannel.description}
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center space-x-2">
            {/* 成员数量 */}
            {currentChannel.members && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{formatMemberCount(currentChannel.members.length)}</span>
              </div>
            )}

            {/* 搜索按钮 */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="搜索消息"
              onClick={() => {
                console.log('搜索功能待实现');
                // TODO: 实现搜索功能
              }}
            >
              <Search className="h-4 w-4" />
            </button>

            {/* 固定消息按钮 */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="固定消息"
              onClick={() => {
                console.log('固定消息功能待实现');
                // TODO: 实现固定消息功能
              }}
            >
              <Pin className="h-4 w-4" />
            </button>

            {/* 频道信息按钮 */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="频道信息"
              onClick={() => setShowChannelInfo(!showChannelInfo)}
            >
              <Info className="h-4 w-4" />
            </button>

            {/* 设置按钮 */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="频道设置"
              onClick={() => {
                console.log('频道设置功能待实现');
                // TODO: 实现频道设置功能
              }}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 频道话题 */}
        {currentChannel.topic && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>话题:</strong> {currentChannel.topic}
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex">
        {/* 消息区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <MessageList
            channelId={numericChannelId}
            onReply={handleReply}
          />

          {/* 正在输入指示器 */}
          <TypingIndicator channelId={numericChannelId} />

          {/* 消息输入 */}
          <MessageInput
            channelId={numericChannelId}
            replyToMessage={replyToMessage}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* 频道信息侧边栏 */}
        {showChannelInfo && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="space-y-6">
              {/* 频道详情 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  频道信息
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getChannelIcon(currentChannel)}
                    <span className="font-medium">{currentChannel.name}</span>
                  </div>
                  {currentChannel.description && (
                    <p className="text-sm text-gray-600">
                      {currentChannel.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500">
                    创建于 {new Date(currentChannel.created_at).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              {/* 连接状态 */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  连接状态
                </h4>
                <div className="flex items-center space-x-2">
                  {getConnectionIcon()}
                  <span className={`text-sm ${
                    connectionState === 'connected' ? 'text-green-600' : 
                    connectionState === 'connecting' || connectionState === 'reconnecting' ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {getConnectionText()}
                  </span>
                </div>
              </div>

              {/* 成员列表 */}
              {currentChannel.members && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    成员 ({currentChannel.members.length})
                  </h4>
                  <div className="space-y-2">
                    {currentChannel.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {member.user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.full_name || member.user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.role === 'admin' ? '管理员' : '成员'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 