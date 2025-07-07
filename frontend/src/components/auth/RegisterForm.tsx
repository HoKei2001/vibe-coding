import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { RegisterRequest } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = (data: RegisterRequest & { confirmPassword: string }) => {
    dispatch(clearError());
    const { confirmPassword, ...registerData } = data;
    dispatch(registerUser(registerData));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center mb-6">
          <UserPlus className="h-8 w-8 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">{t('auth.register.title')}</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              {t('auth.register.username')}
            </label>
            <input
              id="username"
              type="text"
              {...register('username', {
                required: t('validation.required.username'),
                minLength: {
                  value: 3,
                  message: t('validation.minLength.username'),
                },
                maxLength: {
                  value: 20,
                  message: t('validation.maxLength.username'),
                },
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('auth.register.username.placeholder')}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              {t('auth.register.fullname')}
            </label>
            <input
              id="full_name"
              type="text"
              {...register('full_name', {
                required: t('validation.required.fullname'),
                minLength: {
                  value: 1,
                  message: t('validation.fullname.empty'),
                },
                maxLength: {
                  value: 50,
                  message: t('validation.maxLength.fullname'),
                },
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('auth.register.fullname.placeholder')}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('auth.register.email')}
            </label>
            <input
              id="email"
              type="email"
              {...register('email', {
                required: t('validation.required.email'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('validation.invalid.email'),
                },
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('auth.register.email.placeholder')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('auth.register.password')}
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: t('validation.required.password'),
                  minLength: {
                    value: 6,
                    message: t('validation.minLength.password'),
                  },
                })}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('auth.register.password.placeholder')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t('auth.register.confirm')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword', {
                required: t('validation.required.confirmPassword'),
                validate: (value) => value === password || t('validation.password.mismatch'),
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('auth.register.confirm.placeholder')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            {t('auth.register.login')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 