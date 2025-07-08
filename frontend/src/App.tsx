import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser, logout } from './store/slices/authSlice';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { TeamManagement, TeamDetail } from './components/team';
import { ChannelManagement } from './components/channel';
import { ChatInterface, ChatLayout } from './components/chat';
import { Settings } from './components/settings';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeToggle, LanguageToggle } from './components/ui';
import { Users, MessageSquare, Settings as SettingsIcon, Bell } from 'lucide-react';
import { fetchUnreadCount } from './store/slices/notificationSlice';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Auth page component
const AuthPage: React.FC<{ isLogin: boolean }> = ({ isLogin }) => {
  const [currentMode, setCurrentMode] = useState(isLogin);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Update mode when prop changes
  useEffect(() => {
    setCurrentMode(isLogin);
  }, [isLogin]);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSwitchToRegister = () => {
    setCurrentMode(false);
    navigate('/register');
  };

  const handleSwitchToLogin = () => {
    setCurrentMode(true);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow animate-delay-1000" />
      
      {/* 语言和主题切换按钮 */}
      <div className="absolute top-6 right-6 flex items-center space-x-3">
        <LanguageToggle className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm" />
        <ThemeToggle className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm" />
      </div>
      
      {/* 认证表单 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Huddle Up
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-dark-800 shadow-2xl rounded-2xl border border-secondary-200 dark:border-dark-700 overflow-hidden">
          {currentMode ? (
            <LoginForm onSwitchToRegister={handleSwitchToRegister} />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard component (updated with navigation)
const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
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

  const handleNotificationClick = () => {
    navigate('/settings?tab=notifications');
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
      <div className="bg-white dark:bg-dark-900 shadow-sm border-b border-secondary-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Huddle Up
              </h1>
              <div className="hidden sm:block">
                <span className="badge badge-primary">Beta</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageToggle />
              <ThemeToggle />
              <span className="text-secondary-700 dark:text-secondary-300 hidden md:inline">
                {t('dashboard.welcome')}, {user?.username}
              </span>
              
              {/* 通知按钮 */}
              <button
                onClick={handleNotificationClick}
                className="relative p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-800 transition-colors"
                title="通知"
              >
                <Bell className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              
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
      <div className="max-w-7xl mx-auto section-spacing container-padding">
        <div className="space-y-8">
          {/* 欢迎区域 */}
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              {t('dashboard.welcome.title')}, {user?.full_name || user?.username || ''}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              {t('dashboard.subtitle')}
            </p>
          </div>
          
          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 团队管理卡片 */}
            <div 
              className="card-hover p-6 cursor-pointer group animate-fade-in"
              onClick={() => navigate('/teams')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-7 w-7 text-primary-600 dark:text-primary-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {t('dashboard.teams.title')}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t('dashboard.teams.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* 聊天室卡片 */}
            <div 
              className="card-hover p-6 cursor-pointer group animate-fade-in animate-delay-100"
              onClick={() => navigate('/chat')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900 dark:to-success-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="h-7 w-7 text-success-600 dark:text-success-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors">
                    {t('dashboard.messages.title')}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t('dashboard.messages.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* 设置卡片 */}
            <div 
              className="card-hover p-6 cursor-pointer group animate-fade-in animate-delay-200"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-warning-100 to-warning-200 dark:from-warning-900 dark:to-warning-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <SettingsIcon className="h-7 w-7 text-warning-600 dark:text-warning-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-warning-600 dark:group-hover:text-warning-400 transition-colors">
                    {t('nav.settings')}
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    {t('settings.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 开发进度 */}
          <div className="card p-6 animate-fade-in animate-delay-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  {t('progress.title')}
                </h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  {t('progress.subtitle')}
                </p>
              </div>
              <span className="badge badge-success">Phase 1</span>
            </div>
            
            {/* 开发阶段 */}
            <div className="mb-6 space-y-4">
              {/* 阶段1：AI智能基础 */}
              <div className="border border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50 dark:bg-primary-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                    {t('progress.stage1.title')}
                  </h3>
                  <span className="badge badge-primary">{t('progress.in_progress')}</span>
                </div>
                <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
                  {t('progress.stage1.subtitle')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'ai_assistant', completed: false, inProgress: true },
                    { key: 'smart_suggestions', completed: false },
                    { key: 'auto_summary', completed: false },
                    { key: 'intelligent_search', completed: false },
                  ].map((item, index) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        item.completed ? 'bg-success-500' : 
                        item.inProgress ? 'bg-warning-500 animate-pulse' : 
                        'bg-secondary-300'
                      }`} />
                      <span className="text-sm text-primary-700 dark:text-primary-300">
                        {t(`progress.feature.${item.key}`)}
                      </span>
                      {item.inProgress && (
                        <span className="badge badge-warning text-xs">{t('progress.in_progress')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 阶段2：工作流革命 */}
              <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {t('progress.stage2.title')}
                  </h3>
                  <span className="badge badge-secondary">{t('progress.planned')}</span>
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  {t('progress.stage2.subtitle')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'workflow_automation' },
                    { key: 'code_integration' },
                  ].map((item, index) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-secondary-300" />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        {t(`progress.feature.${item.key}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 阶段3：沉浸式体验 */}
              <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {t('progress.stage3.title')}
                  </h3>
                  <span className="badge badge-secondary">{t('progress.planned')}</span>
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                  {t('progress.stage3.subtitle')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'virtual_spaces' },
                    { key: 'focus_rooms' },
                    { key: 'brainstorm_mode' },
                    { key: 'emotional_intelligence' },
                    { key: 'predictive_collaboration' },
                  ].map((item, index) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-secondary-300" />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        {t(`progress.feature.${item.key}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 已完成功能 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                {t('progress.completed')} 基础功能
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'auth' },
                  { key: 'teams' },
                  { key: 'channels' },
                  { key: 'messages' },
                  { key: 'websocket' },
                  { key: 'ui' },
                  { key: 'i18n', isNew: true },
                ].map((item, index) => (
                  <div 
                    key={item.key} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-dark-800 hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
                    style={{ animationDelay: `${(index + 4) * 100}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-success-500" />
                      <span className="text-secondary-700 dark:text-secondary-300 text-sm">
                        {t(`progress.feature.${item.key}`)}
                        {item.isNew && <span className="ml-2 badge badge-primary text-xs">新增</span>}
                      </span>
                    </div>
                    <span className="text-success-600 dark:text-success-400 font-medium text-sm">
                      {t('progress.completed')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">{t('progress.overall')}</span>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">第一阶段开始</span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-success-500 to-primary-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '65%' }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                <span>基础功能完成</span>
                <span>AI功能开发</span>
                <span>未来创新</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// App content component
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    if (isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage isLogin={true} />} />
      <Route path="/register" element={<AuthPage isLogin={false} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:teamId/:channelId"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:teamId"
        element={
          <ProtectedRoute>
            <TeamDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:teamId/channels"
        element={
          <ProtectedRoute>
            <ChannelManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:teamId/channels/:channelId"
        element={
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <AppContent />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
