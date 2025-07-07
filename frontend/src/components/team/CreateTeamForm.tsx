import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createTeam, clearError } from '../../store/slices/teamSlice';
import { X, Users, FileText, Hash, RefreshCw } from 'lucide-react';
import type { CreateTeamRequest } from '../../types';

interface CreateTeamFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateTeamForm: React.FC<CreateTeamFormProps> = ({ onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">创建新团队</h2>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>团队名称</span>
                </div>
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: '团队名称是必填项',
                  minLength: {
                    value: 2,
                    message: '团队名称至少需要2个字符',
                  },
                  maxLength: {
                    value: 50,
                    message: '团队名称最多50个字符',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入团队名称"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4" />
                    <span>团队标识符 (URL)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={autoGenerateSlug}
                        onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-gray-500">自动生成</span>
                    </label>
                    {!autoGenerateSlug && (
                      <button
                        type="button"
                        onClick={handleRegenerateSlug}
                        className="p-1 rounded hover:bg-gray-100"
                        title="重新生成"
                      >
                        <RefreshCw className="h-3 w-3 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </label>
              <input
                id="slug"
                type="text"
                {...register('slug', {
                  required: '团队标识符是必填项',
                  minLength: {
                    value: 3,
                    message: '团队标识符至少需要3个字符',
                  },
                  maxLength: {
                    value: 100,
                    message: '团队标识符最多100个字符',
                  },
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: '只能包含小写字母、数字和横线',
                  },
                })}
                disabled={autoGenerateSlug}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  autoGenerateSlug ? 'bg-gray-50 text-gray-500' : ''
                }`}
                placeholder="team-slug"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                团队链接：dev.motiong.ai/teams/{watch('slug') || 'team-slug'}
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>团队描述</span>
                </div>
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', {
                  required: '团队描述是必填项',
                  minLength: {
                    value: 10,
                    message: '团队描述至少需要10个字符',
                  },
                  maxLength: {
                    value: 200,
                    message: '团队描述最多200个字符',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入团队描述，告诉大家这个团队是做什么的..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
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
              {isSubmitting || isLoading ? '创建中...' : '创建团队'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamForm; 