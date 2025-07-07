import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamById, clearError } from '../../store/slices/teamSlice';
import Navigation from '../common/Navigation';
import TeamMemberList from './TeamMemberList';
import InviteMemberForm from './InviteMemberForm';
import { Users, Settings, Hash, Calendar, Globe, Lock, MessageCircle } from 'lucide-react';

const TeamDetail: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
      <div className="min-h-screen bg-gray-100">
        <Navigation 
          title="团队详情" 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
      <div className="min-h-screen bg-gray-100">
        <Navigation 
          title="团队详情" 
          showBackButton={true} 
          backTo="/teams" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              团队不存在或加载失败
            </h2>
            <p className="text-gray-600 mb-4">
              {error || '无法找到指定的团队'}
            </p>
            <button
              onClick={() => navigate('/teams')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回团队列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        title={`${currentTeam.name} - 团队详情`}
        showBackButton={true} 
        backTo="/teams" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 团队信息卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {currentTeam.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentTeam.name}
                  </h1>
                  <div className="flex items-center space-x-1">
                    {currentTeam.is_public ? (
                      <>
                        <Globe className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          公开
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                          私有
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-3 max-w-2xl">
                  {currentTeam.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Hash className="h-4 w-4" />
                    <span>{currentTeam.slug}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>创建于 {new Date(currentTeam.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/teams/${currentTeam.id}/channels`}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Hash className="h-4 w-4" />
                <span>频道管理</span>
              </Link>
              <button
                onClick={() => {/* TODO: 实现团队设置 */}}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>设置</span>
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