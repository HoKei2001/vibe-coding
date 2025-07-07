import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { fetchUnreadCount } from '../../store/slices/notificationSlice';
import { ArrowLeft, LogOut, Bell } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ThemeToggle, LanguageToggle } from '../ui';

interface NavigationProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

const Navigation: React.FC<NavigationProps> = ({ 
  title, 
  showBackButton = false, 
  backTo = '/dashboard' 
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { t } = useLanguage();

  // 定期获取未读通知数量
  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadCount());
      // 每30秒更新一次未读数量
      const interval = setInterval(() => {
        dispatch(fetchUnreadCount());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleBack = () => {
    navigate(backTo);
  };

  const handleNotificationClick = () => {
    navigate('/settings?tab=notifications');
  };

  return (
    <div className="bg-white dark:bg-dark-900 shadow-sm border-b border-secondary-200 dark:border-dark-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-800 transition-colors"
                title={t('nav.back')}
              >
                <ArrowLeft className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                {title}
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Huddle Up</p>
                <span className="badge badge-primary text-xs">Beta</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 语言切换 */}
            <LanguageToggle />
            
            {/* 主题切换 */}
            <ThemeToggle />
            
            {/* 用户欢迎信息 */}
            <span className="text-secondary-700 dark:text-secondary-300 hidden md:inline">
              {t('dashboard.welcome')}, {user?.username}
            </span>
            
            {/* 通知按钮 */}
            <button
              onClick={handleNotificationClick}
              className="relative p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-800 transition-colors"
              title={t('nav.notifications')}
            >
              <Bell className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* 登出按钮 */}
            <button
              onClick={handleLogout}
              className="btn btn-danger text-sm"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 