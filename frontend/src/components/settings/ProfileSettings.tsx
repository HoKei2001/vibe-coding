import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { userService } from '../../services/userService';
import type { UpdateUserRequest } from '../../types';
import { getCurrentUser } from '../../store/slices/authSlice';
import { User, Camera, Save, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileFormData {
  full_name: string;
  bio: string;
  timezone: string;
  avatar_url: string;
}

const ProfileSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>();

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        bio: user.bio || '',
        timezone: user.timezone || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // 只发送变更的字段
      const updateData: UpdateUserRequest = {};
      if (data.full_name !== user.full_name) updateData.full_name = data.full_name;
      if (data.bio !== (user.bio || '')) updateData.bio = data.bio;
      if (data.timezone !== (user.timezone || '')) updateData.timezone = data.timezone;
      if (data.avatar_url !== (user.avatar_url || '')) updateData.avatar_url = data.avatar_url;

      // 如果没有变更，直接返回
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'success', text: t('settings.profile.no_changes') });
        setIsLoading(false);
        return;
      }

      await userService.updateProfile(user.id, updateData);
      
      // 更新Redux中的用户信息
      await dispatch(getCurrentUser());
      
      setMessage({ type: 'success', text: t('settings.profile.success') });
    } catch (error: any) {
      console.error('更新个人资料失败:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || t('settings.profile.error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (user) {
      reset({
        full_name: user.full_name,
        bio: user.bio || '',
        timezone: user.timezone || '',
        avatar_url: user.avatar_url || ''
      });
      setMessage(null);
    }
  };

  // 生成用户头像
  const generateAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`w-20 h-20 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xl font-bold`}>
        {initials}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          {t('settings.profile.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{t('settings.profile.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.profile.description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* 头像部分 */}
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              generateAvatar(user.full_name)
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{user.full_name}</h4>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span>{t('settings.profile.avatar.change')}</span>
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.userid')}
            </label>
            <input
              type="text"
              value={user.id}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">{t('settings.profile.userid.readonly')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.username')}
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">{t('settings.profile.username.readonly')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-50 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">{t('settings.profile.email.readonly')}</p>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.fullname')} *
            </label>
            <input
              {...register('full_name', {
                required: t('profile.validation.fullname.required'),
                minLength: { value: 2, message: t('profile.validation.fullname.minLength') },
                maxLength: { value: 50, message: t('profile.validation.fullname.maxLength') }
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('settings.profile.fullname.placeholder')}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.profile.timezone')}
            </label>
            <input
              {...register('timezone', {
                maxLength: { value: 50, message: t('profile.validation.timezone.maxLength') }
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('settings.profile.timezone.placeholder')}
            />
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.bio')}
          </label>
          <textarea
            {...register('bio', {
              maxLength: { value: 200, message: t('profile.validation.bio.maxLength') }
            })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('settings.profile.bio.placeholder')}
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.avatar_url')}
          </label>
          <input
            {...register('avatar_url', {
              maxLength: { value: 255, message: t('profile.validation.avatar_url.maxLength') }
            })}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('settings.profile.avatar_url.placeholder')}
          />
          {errors.avatar_url && (
            <p className="mt-1 text-sm text-red-600">{errors.avatar_url.message}</p>
          )}
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-4 w-4" />
            <span>{t('settings.profile.reset')}</span>
          </button>
          <button
            type="submit"
            disabled={!isDirty || isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? t('settings.profile.saving') : t('settings.profile.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings; 