import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createTeam, clearError } from '../../store/slices/teamSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, Users, FileText, Hash, RefreshCw } from 'lucide-react';
import type { CreateTeamRequest } from '../../types';

interface CreateTeamFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { isLoading, error } = useAppSelector((state) => state.teams);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateTeamRequest>();

  const watchName = watch('name', '');

  // 生成slug的函数
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // 移除非字母数字的字符
      .replace(/\s+/g, '-') // 替换空格为横线
      .replace(/-+/g, '-') // 替换多个横线为单个横线
      .replace(/^-+|-+$/g, ''); // 移除开头和结尾的横线
  };

  // 当团队名称改变时自动生成slug
  useEffect(() => {
    if (autoGenerateSlug && watchName) {
      const generatedSlug = generateSlug(watchName);
      setValue('slug', generatedSlug);
    }
  }, [watchName, autoGenerateSlug, setValue]);

  const onSubmit = async (data: CreateTeamRequest) => {
    setIsSubmitting(true);
    dispatch(clearError());
    
    try {
      const result = await dispatch(createTeam(data));
      if (createTeam.fulfilled.match(result)) {
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

  const handleRegenerateSlug = () => {
    if (watchName) {
      const generatedSlug = generateSlug(watchName);
      setValue('slug', generatedSlug);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-dark-700">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('teams.create.title')}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{t('teams.create.name')}</span>
                </div>
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: t('teams.create.name.required'),
                  minLength: {
                    value: 2,
                    message: t('teams.create.name.minLength'),
                  },
                  maxLength: {
                    value: 50,
                    message: t('teams.create.name.maxLength'),
                  },
                })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-700 text-secondary-900 dark:text-secondary-100"
                placeholder={t('teams.create.name.placeholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>{t('teams.create.slug')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={autoGenerateSlug}
                        onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                        {t('teams.create.slug.auto')}
                      </span>
                    </label>
                    {!autoGenerateSlug && (
                      <button
                        type="button"
                        onClick={handleRegenerateSlug}
                        className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-dark-700"
                        title={t('teams.create.slug.regenerate')}
                      >
                        <RefreshCw className="h-3 w-3 text-secondary-400 dark:text-secondary-500" />
                      </button>
                    )}
                  </div>
                </div>
              </label>
              <input
                id="slug"
                type="text"
                {...register('slug', {
                  required: t('teams.create.slug.required'),
                  minLength: {
                    value: 3,
                    message: t('teams.create.slug.minLength'),
                  },
                  maxLength: {
                    value: 100,
                    message: t('teams.create.slug.maxLength'),
                  },
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: t('teams.create.slug.pattern'),
                  },
                })}
                disabled={autoGenerateSlug}
                className={`w-full px-3 py-2 border border-secondary-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  autoGenerateSlug 
                    ? 'bg-secondary-50 dark:bg-dark-600 text-secondary-500 dark:text-secondary-400' 
                    : 'bg-white dark:bg-dark-700 text-secondary-900 dark:text-secondary-100'
                }`}
                placeholder={t('teams.create.slug.placeholder')}
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                {t('teams.create.slug.preview')}dev.motiong.ai/teams/{watch('slug') || 'team-slug'}
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>{t('teams.create.description')}</span>
                </div>
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', {
                  required: t('teams.create.description.required'),
                  minLength: {
                    value: 10,
                    message: t('teams.create.description.minLength'),
                  },
                  maxLength: {
                    value: 200,
                    message: t('teams.create.description.maxLength'),
                  },
                })}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-dark-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-dark-700 text-secondary-900 dark:text-secondary-100"
                placeholder={t('teams.create.description.placeholder')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? t('teams.create.creating') : t('teams.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamForm; 