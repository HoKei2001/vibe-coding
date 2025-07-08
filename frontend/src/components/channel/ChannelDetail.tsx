import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getChannelById, clearError } from '../../store/slices/channelSlice';
import { getTeamById } from '../../store/slices/teamSlice';
import Navigation from '../common/Navigation';
import SummaryGenerator from '../ai/SummaryGenerator';
import { MessageCircle, Hash, Lock, Users, Settings, ArrowLeft, FileText, Brain } from 'lucide-react';

const ChannelDetail: React.FC = () => {
  const { teamId, channelId } = useParams<{ teamId: string; channelId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentChannel, isLoading, error } = useAppSelector((state) => state.channels);
  const { currentTeam } = useAppSelector((state) => state.teams);
  const [showSummaryGenerator, setShowSummaryGenerator] = useState(false);

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

  const handleStartChat = () => {
    navigate(`/teams/${teamId}/channels/${channelId}/chat`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation 
          title="加载中..." 
          showBackButton={true} 
          backTo={`/teams/${teamId}/channels`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
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
      
      {/* AI摘要生成器弹窗 */}
      {showSummaryGenerator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <SummaryGenerator
              channelId={currentChannel.id}
              channelName={currentChannel.name}
              isVisible={showSummaryGenerator}
              onClose={() => setShowSummaryGenerator(false)}
            />
          </div>
        </div>
      )}
      
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
              {/* AI摘要生成按钮 */}
              <button
                onClick={() => setShowSummaryGenerator(true)}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 border border-purple-300 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                title="AI智能摘要 - 生成频道讨论摘要"
              >
                <div className="relative">
                  <FileText className="h-4 w-4" />
                  <Brain className="h-2 w-2 absolute -top-1 -right-1" />
                </div>
                <span>AI摘要</span>
              </button>
              
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

        {/* AI功能亮点 */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                AI智能功能
              </h3>
              <p className="text-purple-700 mb-4">
                体验下一代团队协作，AI助手让沟通更高效
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 text-sm text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>智能消息建议</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>自动会议摘要</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-purple-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>语义智能搜索</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 即将上线提示 */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <MessageCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            开始在此频道聊天
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            加入 {currentChannel.name}，与团队成员进行实时交流。体验AI增强的智能聊天功能。
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleStartChat}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              <MessageCircle className="h-5 w-5" />
              <span>开始聊天</span>
            </button>
            
            <button
              onClick={() => setShowSummaryGenerator(true)}
              className="flex items-center space-x-2 px-6 py-3 border border-purple-300 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>查看摘要</span>
            </button>
          </div>

          {/* 功能提示 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">💡 AI功能使用提示</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">✨</span>
                <span>聊天时点击✨按钮获取智能回复建议</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">🔍</span>
                <span>使用AI搜索快速找到相关讨论</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">📝</span>
                <span>AI自动生成会议纪要和讨论摘要</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">🎯</span>
                <span>基于上下文的个性化智能建议</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetail; 