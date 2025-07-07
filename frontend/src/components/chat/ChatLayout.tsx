import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getUserTeams } from '../../store/slices/teamSlice';
import { getTeamChannels } from '../../store/slices/channelSlice';
import ChatInterface from './ChatInterface';
import Navigation from '../common/Navigation';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Hash, 
  Lock, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare,
  Settings,
  Home,
  Plus
} from 'lucide-react';
import type { Team, Channel } from '../../types';

const ChatLayout: React.FC = () => {
  const { teamId, channelId } = useParams<{ teamId?: string; channelId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  
  const { teams, isLoading: teamsLoading } = useAppSelector((state) => state.teams);
  const { channels, isLoading: channelsLoading } = useAppSelector((state) => state.channels);
  const { user } = useAppSelector((state) => state.auth);
  
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    teamId ? parseInt(teamId) : null
  );
  
  // 获取用户的团队列表
  useEffect(() => {
    dispatch(getUserTeams());
  }, [dispatch]);
  
  // 当选择团队时，获取频道列表
  useEffect(() => {
    if (selectedTeamId) {
      dispatch(getTeamChannels({ teamId: selectedTeamId, includeArchived: false }));
      setExpandedTeams(prev => new Set([...prev, selectedTeamId]));
    }
  }, [selectedTeamId, dispatch]);
  
  // 当URL中有teamId时，设置选中的团队
  useEffect(() => {
    if (teamId && !selectedTeamId) {
      const numericTeamId = parseInt(teamId);
      setSelectedTeamId(numericTeamId);
    }
  }, [teamId, selectedTeamId]);

  const toggleTeamExpanded = (teamId: number) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
      // 如果展开团队，也选择该团队
      setSelectedTeamId(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const selectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    dispatch(getTeamChannels({ teamId: team.id, includeArchived: false }));
    // 如果团队没有展开，则展开它
    if (!expandedTeams.has(team.id)) {
      setExpandedTeams(prev => new Set([...prev, team.id]));
    }
  };

  const selectChannel = (channel: Channel) => {
    navigate(`/chat/${channel.team_id}/${channel.id}`);
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

  const currentTeam = teams.find(team => team.id === selectedTeamId);
  const teamChannels = selectedTeamId ? channels.filter(channel => channel.team_id === selectedTeamId) : [];

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
      <Navigation 
        title={t('dashboard.messages.title')} 
        showBackButton={true} 
        backTo="/dashboard" 
      />
      
      <div className="flex h-[calc(100vh-88px)] bg-secondary-50 dark:bg-dark-950">
        {/* 左侧导航栏 */}
        <div className="w-80 bg-white dark:bg-dark-900 border-r border-secondary-200 dark:border-dark-700 flex flex-col">
          {/* 头部 */}
          <div className="p-4 border-b border-secondary-200 dark:border-dark-700">
            {/* 用户信息 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-xs text-secondary-500 dark:text-secondary-400">{t('messages.online')}</div>
              </div>
            </div>
          </div>

          {/* 团队和频道列表 */}
          <div className="flex-1 overflow-y-auto">
            {teamsLoading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-secondary-200 dark:bg-dark-700 rounded"></div>
                  ))}
                </div>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-3" />
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">{t('teams.list.empty')}</p>
                <button
                  onClick={() => navigate('/teams')}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                >
                  {t('teams.list.create_first')}
                </button>
              </div>
            ) : (
              <div className="py-2">
                {teams.map((team) => (
                  <div key={team.id} className="mb-1">
                    {/* 团队头部 */}
                    <div 
                      className={`flex items-center px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTeamId === team.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                          : 'hover:bg-secondary-100 dark:hover:bg-dark-700 text-secondary-700 dark:text-secondary-300'
                      }`}
                      onClick={() => selectTeam(team)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTeamExpanded(team.id);
                        }}
                        className="mr-2 p-1 hover:bg-secondary-200 dark:hover:bg-dark-600 rounded"
                      >
                        {expandedTeams.has(team.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded flex items-center justify-center text-white text-xs font-semibold mr-3">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 font-medium truncate">{team.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teams/${team.id}`);
                        }}
                        className="ml-2 p-1 hover:bg-secondary-200 dark:hover:bg-dark-600 rounded"
                        title={t('teams.settings')}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 频道列表 */}
                    {expandedTeams.has(team.id) && (
                      <div className="ml-8 mr-2 mt-1">
                        {channelsLoading && selectedTeamId === team.id ? (
                          <div className="animate-pulse space-y-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-8 bg-secondary-200 dark:bg-dark-700 rounded"></div>
                            ))}
                          </div>
                        ) : teamChannels.length === 0 ? (
                          <div className="py-2 text-center">
                            <p className="text-secondary-500 dark:text-secondary-400 text-sm">{t('channels.title')}</p>
                            <button
                              onClick={() => navigate(`/teams/${team.id}/channels`)}
                              className="mt-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {t('channels.create')}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {teamChannels.map((channel) => (
                              <div
                                key={channel.id}
                                className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                  channelId && parseInt(channelId) === channel.id
                                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'hover:bg-secondary-50 dark:hover:bg-dark-600 text-secondary-600 dark:text-secondary-400'
                                }`}
                                onClick={() => selectChannel(channel)}
                              >
                                <div className="mr-2 text-secondary-400 dark:text-secondary-500">
                                  {getChannelIcon(channel)}
                                </div>
                                <span className="flex-1 text-sm truncate">{channel.name}</span>
                                {channel.is_archived && (
                                  <span className="text-xs text-secondary-400 dark:text-secondary-500 ml-2">已归档</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作区 */}
          <div className="p-4 border-t border-secondary-200 dark:border-dark-700">
            <button
              onClick={() => navigate('/teams')}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('teams.title')}
            </button>
          </div>
        </div>

        {/* 右侧聊天区域 */}
        <div className="flex-1 flex flex-col">
          {teamId && channelId ? (
            <ChatInterface />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-secondary-50 dark:bg-dark-950">
              <div className="text-center max-w-md">
                <MessageSquare className="h-16 w-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  {t('messages.title')}
                </h3>
                <p className="text-secondary-500 dark:text-secondary-400 mb-6">
                  从左侧选择一个团队和频道，开始与团队成员进行实时沟通。
                </p>
                {teams.length === 0 && (
                  <button
                    onClick={() => navigate('/teams')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('teams.list.create_first')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout; 