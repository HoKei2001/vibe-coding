import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addTeamMember, clearError } from '../../store/slices/teamSlice';
import { X, UserPlus, Mail, Users, Crown, Shield, User } from 'lucide-react';
import type { Team } from '../../types';

interface InviteMemberFormProps {
  team: Team;
  onClose: () => void;
  onSuccess?: () => void;
}

interface InviteMemberData {
  user_id: string;
  role: 'admin' | 'member' | 'guest';
}

const InviteMemberForm: React.FC<InviteMemberFormProps> = ({ team, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.teams);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InviteMemberData>({
    defaultValues: {
      role: 'member'
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteMemberData) => {
    setIsSubmitting(true);
    dispatch(clearError());
    
    try {
      const result = await dispatch(addTeamMember({
        teamId: team.id,
        userId: parseInt(data.user_id),
        role: data.role
      }));
      
      if (addTeamMember.fulfilled.match(result)) {
        reset();
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      // Error is handled by the slice
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    dispatch(clearError());
    onClose();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
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

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return '可以管理团队设置、邀请成员、创建频道';
      case 'member':
        return '可以参与讨论、创建频道、邀请成员';
      case 'guest':
        return '只能查看和参与已邀请的频道';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">邀请团队成员</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>用户ID</span>
                </div>
              </label>
              <input
                id="user_id"
                type="number"
                {...register('user_id', {
                  required: '用户ID是必填项',
                  pattern: {
                    value: /^\d+$/,
                    message: '请输入有效的用户ID',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入要邀请的用户ID"
              />
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                💡 提示：您可以从用户列表中获取用户ID，或询问用户提供
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4" />
                  <span>选择角色</span>
                </div>
              </label>
              
              <div className="space-y-3">
                {(['admin', 'member', 'guest'] as const).map((role) => (
                  <label
                    key={role}
                    className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors ${
                      selectedRole === role ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      {getRoleIcon(role)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {role === 'admin' && '管理员'}
                            {role === 'member' && '成员'}
                            {role === 'guest' && '访客'}
                          </span>
                          {selectedRole === role && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? '邀请中...' : '发送邀请'}
            </button>
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-start space-x-2">
            <Users className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">邀请说明：</p>
              <ul className="space-y-1">
                <li>• 被邀请用户需要先注册账号</li>
                <li>• 邀请成功后，用户将立即加入团队</li>
                <li>• 您可以稍后在成员列表中修改角色</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberForm; 