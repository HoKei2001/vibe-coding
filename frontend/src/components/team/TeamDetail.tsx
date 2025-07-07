import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamById, clearError } from '../../store/slices/teamSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import Navigation from '../common/Navigation';
import TeamMemberList from './TeamMemberList';
import InviteMemberForm from './InviteMemberForm';
import { Users, Settings, Hash, Calendar, Globe, Lock, MessageCircle } from 'lucide-react';

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { currentTeam, isLoading, error } = useAppSelector((state) => state.teams);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    if (teamId) {
      dispatch(getTeamById(parseInt(teamId)));
    }
  }, [dispatch, teamId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleInviteMember = () => {
    setShowInviteForm(true);
  };

  const handleCloseInviteForm = () => {
    setShowInviteForm(false);
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    // Refresh team data to show new member
    if (teamId) {
      dispatch(getTeamById(parseInt(teamId)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
        <Navigation 
          title={t('teams.title')} 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 mb-6">
              <div className="h-8 bg-secondary-200 dark:bg-dark-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-secondary-200 dark:bg-dark-700 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-secondary-200 dark:bg-dark-700 rounded w-1/2"></div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
              <div className="h-6 bg-secondary-200 dark:bg-dark-700 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-secondary-200 dark:bg-dark-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentTeam) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
        <Navigation 
          title={t('teams.title')} 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              团队不存在或加载失败
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              {error || '无法找到指定的团队'}
            </p>
            <button
              onClick={() => navigate('/teams')}
              className="btn btn-primary"
            >
              返回团队列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
      <Navigation 
        title={currentTeam.name}
        showBackButton={true} 
        backTo="/teams" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 团队信息卡片 */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 mb-6 border border-secondary-200 dark:border-dark-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {currentTeam.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {currentTeam.name}
                  </h1>
                  <div className="flex items-center space-x-1">
                    {currentTeam.is_public ? (
                      <>
                        <Globe className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
                          公开
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-secondary-500" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-dark-700 px-2 py-1 rounded-full">
                          私有
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-secondary-600 dark:text-secondary-400 mb-3 max-w-2xl">
                  {currentTeam.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center space-x-1">
                    <Hash className="h-4 w-4" />
                    <span>{currentTeam.slug}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{t('teams.created_at', { date: new Date(currentTeam.created_at).toLocaleDateString('zh-CN') })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/teams/${currentTeam.id}/channels`}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Hash className="h-4 w-4" />
                <span>{t('channels.title')}</span>
              </Link>
              <button
                onClick={() => {/* TODO: 实现团队设置 */}}
                className="flex items-center space-x-2 px-4 py-2 text-secondary-600 dark:text-secondary-400 border border-secondary-300 dark:border-dark-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-dark-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>{t('teams.settings')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 团队成员列表 */}
        <TeamMemberList 
          team={currentTeam}
          members={currentTeam.members || []}
          onInviteMember={handleInviteMember}
        />

        {/* 邀请成员表单 */}
        {showInviteForm && (
          <InviteMemberForm
            team={currentTeam}
            onClose={handleCloseInviteForm}
            onSuccess={handleInviteSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default TeamDetail; 