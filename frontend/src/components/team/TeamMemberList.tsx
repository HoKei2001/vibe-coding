import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getTeamMembers, removeTeamMember, clearError, getTeamById } from '../../store/slices/teamSlice';
import { Users, Crown, Shield, User, UserX, Mail, MoreHorizontal, UserPlus } from 'lucide-react';
import type { TeamMember, Team } from '../../types';

interface TeamMemberListProps {
  team: Team;
  members: TeamMember[];
  onInviteMember: () => void;
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({ team, members, onInviteMember }) => {
  const dispatch = useAppDispatch();
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
        return <User className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return '所有者';
      case 'admin':
        return '管理员';
      case 'member':
        return '成员';
      case 'guest':
        return '访客';
      default:
        return '成员';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'guest':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3 mt-1"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
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
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              团队成员 ({members.length})
            </h3>
          </div>
          <button
            onClick={onInviteMember}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>邀请成员</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">还没有团队成员</p>
            <button
              onClick={onInviteMember}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              邀请第一个成员
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {member.user?.full_name || member.user?.username}
                      </span>
                      {member.user.id === currentUser?.id && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          你
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="移除成员"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                移除团队成员
              </h3>
              <p className="text-gray-600 mb-6">
                确定要将 <strong>{selectedMember.user?.full_name || selectedMember.user?.username}</strong> 从团队中移除吗？
                此操作无法撤销。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setSelectedMember(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={() => handleRemoveMember(selectedMember)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  移除
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