import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamMembers, removeTeamMember, clearError, getTeamById } from '../../store/slices/teamSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users, Crown, Shield, User, UserX, Mail, MoreHorizontal, UserPlus } from 'lucide-react';
import type { TeamMember, Team } from '../../types';

interface TeamMemberListProps {
  team: Team;
  members: TeamMember[];
  onInviteMember: () => void;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({ team, members, onInviteMember }) => {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { isLoading, error } = useAppSelector((state) => state.teams);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member':
        return <User className="h-4 w-4 text-green-500" />;
      case 'guest':
        return <User className="h-4 w-4 text-secondary-500" />;
      default:
        return <User className="h-4 w-4 text-secondary-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return t('teams.roles.owner');
      case 'admin':
        return t('teams.roles.admin');
      case 'member':
        return t('teams.roles.member');
      case 'guest':
        return t('teams.roles.guest');
      default:
        return t('teams.roles.member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'admin':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'member':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'guest':
        return 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300';
      default:
        return 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-800 dark:text-secondary-300';
    }
  };

  const canManageMember = (member: TeamMember): boolean => {
    if (!currentUser) return false;
    
    // 不能管理自己
    if (member.user.id === currentUser.id) return false;
    
    // 所有者和管理员可以管理其他成员
    const currentUserMember = members.find(m => m.user.id === currentUser.id);
    return currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!team?.id) return;
    
    try {
      const result = await dispatch(removeTeamMember({ teamId: team.id, memberId: member.user.id }));
      if (removeTeamMember.fulfilled.match(result)) {
        setShowRemoveConfirm(false);
        setSelectedMember(null);
        // 重新获取团队数据以更新成员列表
        await dispatch(getTeamById(team.id));
      }
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const confirmRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowRemoveConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 border border-secondary-200 dark:border-dark-700">
        <div className="animate-pulse">
          <div className="h-6 bg-secondary-200 dark:bg-dark-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-200 dark:bg-dark-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-200 dark:bg-dark-700 rounded w-1/2"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-dark-700 rounded w-1/3 mt-1"></div>
                </div>
                <div className="w-16 h-6 bg-secondary-200 dark:bg-dark-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md border border-secondary-200 dark:border-dark-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {t('teams.members.title')} ({members.length})
            </h3>
          </div>
          <button
            onClick={onInviteMember}
            className="btn btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('teams.invite.title')}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-3" />
            <p className="text-secondary-500 dark:text-secondary-400 mb-4">
              {t('teams.members.empty')}
            </p>
            <button
              onClick={onInviteMember}
              className="btn btn-primary"
            >
              {t('teams.members.invite_first')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-secondary-200 dark:border-dark-600 rounded-lg hover:border-secondary-300 dark:hover:border-dark-500 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-secondary-900 dark:text-secondary-100">
                        {member.user?.full_name || member.user?.username}
                      </span>
                      {member.user.id === currentUser?.id && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {t('teams.members.you')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-secondary-500 dark:text-secondary-400">
                      <Mail className="h-3 w-3" />
                      <span>{member.user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span>{getRoleText(member.role)}</span>
                  </div>

                  {canManageMember(member) && (
                    <div className="relative">
                      <button
                        onClick={() => confirmRemoveMember(member)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={t('teams.members.remove')}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 移除成员确认对话框 */}
      {showRemoveConfirm && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                {t('teams.members.remove_confirm')}
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                {t('teams.members.remove_confirm_text')}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setSelectedMember(null);
                  }}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleRemoveMember(selectedMember)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  {t('teams.members.remove')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberList; 