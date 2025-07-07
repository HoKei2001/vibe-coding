import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addTeamMember, clearError } from '../../store/slices/teamSlice';
import { X, UserPlus, Mail, Users, Crown, Shield, User, Info } from 'lucide-react';
import type { Team } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 检查当前用户在团队中的角色
  const currentUserMember = team.members?.find(m => m.user.id === currentUser?.id);
  const canInvite = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

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
    setLocalError(null);
    
    try {
      // 检查用户是否已经是团队成员
      const userId = parseInt(data.user_id);
      const existingMember = team.members?.find(member => member.user.id === userId);
      
      if (existingMember) {
        setLocalError('该用户已经是团队成员了！请检查用户ID或选择其他用户。');
        setIsSubmitting(false);
        return;
      }
      
      // 检查是否试图邀请自己
      if (userId === currentUser?.id) {
        setLocalError('您不能邀请自己加入团队！');
        setIsSubmitting(false);
        return;
      }
      
      const result = await dispatch(addTeamMember({
        teamId: team.id,
        userId: userId,
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
    setLocalError(null);
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
        return t('teams.invite.role.admin.desc');
      case 'member':
        return t('teams.invite.role.member.desc');
      case 'guest':
        return t('teams.invite.role.guest.desc');
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{t('teams.invite.title')}</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {(localError || error) && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {localError || error}
            </div>
          )}
          
          {/* 权限检查警告 */}
          {!canInvite && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 rounded">
              <p className="text-sm">
                <strong>{t('teams.invite.permission.insufficient')}</strong> {t('teams.invite.permission.admin_only')}
                {t('teams.invite.permission.current_role')}<span className="font-medium">{currentUserMember?.role || t('teams.invite.permission.unknown')}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>{t('teams.invite.userid')}</span>
                </div>
              </label>
              <input
                id="user_id"
                type="number"
                {...register('user_id', {
                  required: t('validation.required.username'),
                  pattern: {
                    value: /^\d+$/,
                    message: t('validation.invalid.email'),
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('teams.invite.userid.placeholder')}
              />
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-600">{errors.user_id.message}</p>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">{t('teams.invite.userid.hint')}</p>
                    <p>{t('teams.invite.userid.location')}</p>
                  </div>
                </div>
              </div>
              
              {/* 当前团队成员列表 */}
              {team.members && team.members.length > 0 && (
                <div className="mt-3 p-3 bg-secondary-50 dark:bg-dark-700 border border-secondary-200 dark:border-dark-600 rounded-md">
                  <p className="text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    {t('teams.invite.members.current')}
                  </p>
                  <div className="space-y-1">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between text-xs text-secondary-600 dark:text-secondary-400">
                        <span>{member.user.full_name || member.user.username}</span>
                        <span className="text-secondary-500 dark:text-secondary-500">ID: {member.user.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4" />
                  <span>{t('teams.invite.role')}</span>
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
                            {t(`teams.invite.role.${role}`)}
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
              {t('teams.invite.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !canInvite}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!canInvite ? t('teams.invite.permission.insufficient') : (isSubmitting || isLoading ? t('teams.invite.sending') : t('teams.invite.send'))}
            </button>
          </div>
        </form>

        <div className="bg-secondary-50 dark:bg-dark-700 px-6 py-4 border-t border-secondary-200 dark:border-dark-600">
          <div className="flex items-start space-x-2">
            <Users className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              <p className="font-medium mb-1">{t('teams.invite.note.title')}：</p>
              <ul className="space-y-1">
                <li>• {t('teams.invite.notes.notification')}</li>
                <li>• {t('teams.invite.notes.response')}</li>
                <li>• {t('teams.invite.notes.manage')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberForm; 