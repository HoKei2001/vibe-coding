import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getChannelById, clearError } from '../../store/slices/channelSlice';
import { getTeamById } from '../../store/slices/teamSlice';
import Navigation from '../common/Navigation';
import { MessageCircle, Hash, Lock, Users, Settings, ArrowLeft } from 'lucide-react';

const ChannelDetail: React.FC = () => {
  const { teamId, channelId } = useParams<{ teamId: string; channelId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentChannel, isLoading, error } = useAppSelector((state) => state.channels);
  const { currentTeam } = useAppSelector((state) => state.teams);

  useEffect(() => {
    if (channelId) {
      dispatch(getChannelById(parseInt(channelId)));
    }
    if (teamId) {
      dispatch(getTeamById(parseInt(teamId)));
    }
  }, [dispatch, channelId, teamId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Hash className="h-6 w-6 text-green-500" />;
      case 'private':
        return <Lock className="h-6 w-6 text-red-500" />;
      default:
        return <Hash className="h-6 w-6 text-gray-500" />;
    }
  };

  const getChannelTypeText = (type: string) => {
    switch (type) {
      case 'public':
        return '公开频道';
      case 'private':
        return '私有频道';
      default:
        return '频道';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation 
          title="频道详情" 
          showBackButton={true} 
          backTo={`/teams/${teamId}/channels`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentChannel) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation 
          title="频道详情" 
          showBackButton={true} 
          backTo={`/teams/${teamId}/channels`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 mb-4">
              <Hash className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              频道不存在或加载失败
            </h2>
            <p className="text-gray-600 mb-4">
              {error || '无法找到指定的频道'}
            </p>
            <button
              onClick={() => navigate(`/teams/${teamId}/channels`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回频道列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        title={`# ${currentChannel.name}`}
        showBackButton={true} 
        backTo={`/teams/${teamId}/channels`}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 频道信息 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                {getChannelIcon(currentChannel.type)}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    # {currentChannel.name}
                  </h1>
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {getChannelTypeText(currentChannel.type)}
                  </span>
                </div>
                {currentChannel.description && (
                  <p className="text-gray-600 mb-2 max-w-2xl">
                    {currentChannel.description}
                  </p>
                )}
                {currentChannel.topic && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600 mb-3">
                    <MessageCircle className="h-4 w-4" />
                    <span>话题: {currentChannel.topic}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{currentChannel.members?.length || 0} 成员</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>创建于 {new Date(currentChannel.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {/* TODO: 频道设置 */}}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>设置</span>
              </button>
            </div>
          </div>
        </div>

        {/* 即将上线提示 */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-12 w-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            聊天功能即将上线！ 🚀
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            我们正在努力开发实时聊天功能。很快您就可以在这个频道中与团队成员进行实时交流了。
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">即将推出的功能</h3>
            <ul className="text-sm text-blue-800 text-left max-w-sm mx-auto space-y-1">
              <li>✨ 实时消息发送和接收</li>
              <li>💬 消息回复和引用</li>
              <li>📎 文件和图片分享</li>
              <li>🔔 消息通知</li>
              <li>🔍 消息搜索</li>
              <li>👥 @提及其他成员</li>
            </ul>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/teams/${teamId}/channels`)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回频道列表</span>
            </button>
            
            <button
              onClick={() => navigate(`/teams/${teamId}`)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>查看团队</span>
            </button>
          </div>
        </div>

        {/* 开发进度 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">开发进度</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">频道管理</span>
              <span className="text-green-600 font-semibold">✓ 已完成</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">实时聊天界面</span>
              <span className="text-blue-600 font-semibold">🚀 开发中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">WebSocket连接</span>
              <span className="text-gray-400">⏳ 计划中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">文件上传</span>
              <span className="text-gray-400">⏳ 计划中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetail; 