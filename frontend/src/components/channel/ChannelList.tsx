import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamChannels, clearError } from '../../store/slices/channelSlice';
import { 
  Hash, 
  Lock, 
  Plus, 
  Search, 
  Archive, 
  Users,
  MessageCircle
} from 'lucide-react';
import type { Channel, Team } from '../../types';

interface ChannelListProps {
  team: Team;
  onCreateChannel: () => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ team, onCreateChannel }) => {
  const dispatch = useAppDispatch();
  const { channels, isLoading, error } = useAppSelector((state) => state.channels);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (team?.id) {
      dispatch(getTeamChannels({ teamId: team.id, includeArchived: showArchived }));
    }
  }, [dispatch, team?.id, showArchived]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const getChannelIcon = (channel: Channel) => {
    switch (channel.type) {
      case 'public':
        return <Hash className="h-4 w-4 text-gray-500" />;
      case 'private':
        return <Lock className="h-4 w-4 text-gray-500" />;
      case 'direct':
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Hash className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChannelTypeText = (type: string) => {
    switch (type) {
      case 'public':
        return '公开频道';
      case 'private':
        return '私有频道';
      case 'direct':
        return '直接消息';
      default:
        return '频道';
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         channel.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? true : !channel.is_archived;
    return matchesSearch && matchesArchived;
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {team.name} 的频道
          </h2>
          <button
            onClick={onCreateChannel}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>创建频道</span>
          </button>
        </div>

        {/* 搜索和过滤 */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索频道..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">显示已归档频道</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {filteredChannels.length === 0 ? (
          <div className="text-center py-8">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              {searchQuery ? '没有找到匹配的频道' : '还没有创建频道'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateChannel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建第一个频道
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChannels.map((channel) => (
              <Link
                key={channel.id}
                to={`/teams/${team.id}/channels/${channel.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getChannelIcon(channel)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">
                          {channel.name}
                        </h3>
                        {channel.is_archived && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Archive className="h-3 w-3" />
                            <span>已归档</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {channel.description || '无描述'}
                      </p>
                      {channel.topic && (
                        <p className="text-xs text-blue-600 mt-1">
                          话题: {channel.topic}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{channel.members?.length || 0}</span>
                    </div>
                    <div className="text-xs">
                      {getChannelTypeText(channel.type)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList; 