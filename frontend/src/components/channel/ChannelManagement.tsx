import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamById, clearError } from '../../store/slices/teamSlice';
import { getTeamChannels } from '../../store/slices/channelSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import Navigation from '../common/Navigation';
import ChannelList from './ChannelList';
import CreateChannelForm from './CreateChannelForm';
import { Hash } from 'lucide-react';

const ChannelManagement: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { currentTeam, isLoading, error } = useAppSelector((state) => state.teams);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const handleCreateChannel = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Refresh channels list
    if (teamId) {
      dispatch(getTeamChannels({ teamId: parseInt(teamId), includeArchived: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
        <Navigation 
          title={t('channels.title')} 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6">
              <div className="h-8 bg-secondary-200 dark:bg-dark-700 rounded w-1/3 mb-4"></div>
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
          title={t('channels.title')} 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 mb-4">
              <Hash className="h-12 w-12 mx-auto" />
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
        title={`${currentTeam.name} - ${t('channels.title')}`}
        showBackButton={true} 
        backTo={`/teams/${teamId}`}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 频道列表 */}
        <ChannelList 
          team={currentTeam} 
          onCreateChannel={handleCreateChannel}
        />

        {/* 创建频道表单 */}
        {showCreateForm && (
          <CreateChannelForm
            team={currentTeam}
            onClose={handleCloseCreateForm}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default ChannelManagement; 