import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { createChannel, clearError } from '../../store/slices/channelSlice';
import { X, Hash, Lock, Globe, MessageCircle } from 'lucide-react';
import type { Team, CreateChannelRequest } from '../../types';

interface CreateChannelFormProps {
  team: Team;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CreateChannelData {
  name: string;
  description: string;
  type: 'public' | 'private';
  topic: string;
}

const CreateChannelForm: React.FC<CreateChannelFormProps> = ({ team, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.channels);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateChannelData>({
    defaultValues: {
      type: 'public',
      description: '',
      topic: '',
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: CreateChannelData) => {
    setIsSubmitting(true);
    dispatch(clearError());
    
    try {
      const channelData: CreateChannelRequest = {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        topic: data.topic || undefined,
        team_id: team.id
      };

      const result = await dispatch(createChannel(channelData));
      
      if (createChannel.fulfilled.match(result)) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Hash className="h-4 w-4 text-green-500" />;
      case 'private':
        return <Lock className="h-4 w-4 text-red-500" />;
      default:
        return <Hash className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'public':
        return '团队中的所有成员都可以看到和加入此频道';
      case 'private':
        return '只有被邀请的成员才能看到和加入此频道';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            在 {team.name} 中创建频道
          </h2>
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
            {/* 频道名称 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                频道名称 *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', {
                  required: '频道名称是必填项',
                  minLength: {
                    value: 1,
                    message: '频道名称不能为空',
                  },
                  maxLength: {
                    value: 100,
                    message: '频道名称不能超过100个字符',
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
                    message: '频道名称只能包含字母、数字、中文、下划线和横线',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：general、产品讨论、随机话题"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* 频道描述 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                频道描述
              </label>
              <textarea
                id="description"
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: '频道描述不能超过500个字符',
                  },
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="简单描述一下这个频道的用途..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* 频道话题 */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                频道话题
              </label>
              <input
                id="topic"
                type="text"
                {...register('topic', {
                  maxLength: {
                    value: 255,
                    message: '频道话题不能超过255个字符',
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="为频道设置一个话题..."
              />
              {errors.topic && (
                <p className="mt-1 text-sm text-red-600">{errors.topic.message}</p>
              )}
            </div>

            {/* 频道类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                频道类型 *
              </label>
              
              <div className="space-y-3">
                {(['public', 'private'] as const).map((type) => (
                  <label
                    key={type}
                    className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors ${
                      selectedType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      {getTypeIcon(type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {type === 'public' ? '公开频道' : '私有频道'}
                          </span>
                          {selectedType === type && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {getTypeDescription(type)}
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
              {isSubmitting || isLoading ? '创建中...' : '创建频道'}
            </button>
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">创建频道说明：</p>
              <ul className="space-y-1">
                <li>• 频道名称创建后可以修改</li>
                <li>• 公开频道所有团队成员都可以看到</li>
                <li>• 私有频道只有被邀请的成员才能访问</li>
                <li>• 频道创建后，您将自动成为频道管理员</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelForm; 