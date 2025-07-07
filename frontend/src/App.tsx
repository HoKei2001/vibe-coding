import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { getCurrentUser } from './store/slices/authSlice';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import { TeamManagement, TeamDetail } from './components/team';
import { ChannelManagement } from './components/channel';
import { ChatInterface } from './components/chat';
import { Settings } from './components/settings';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ui/ThemeToggle';
import { Users, MessageSquare, Settings as SettingsIcon } from 'lucide-react';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Auth page component
const AuthPage: React.FC<{ isLogin: boolean }> = ({ isLogin }) => {
  const [currentMode, setCurrentMode] = useState(isLogin);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
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
      
      {/* 主题切换按钮 */}
      <div className="absolute top-6 right-6">
        <ThemeToggle className="bg-white dark:bg-dark-800 shadow-lg" />
      </div>
      
      {/* 认证表单 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Huddle Up
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            团队协作，从这里开始
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch({ type: 'auth/logout/fulfilled' });
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
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-secondary-700 dark:text-secondary-300 hidden sm:inline">
                欢迎, {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-danger text-sm"
              >
                退出登录
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
              欢迎回来，{user?.full_name || user?.username}！
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              开始创建团队，邀请成员，在频道中进行实时协作交流
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
                    团队管理
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    创建和管理您的团队
                  </p>
                </div>
              </div>
            </div>

            {/* 聊天室卡片 */}
            <div 
              className="card-hover p-6 cursor-pointer group animate-fade-in animate-delay-100"
              onClick={() => navigate('/teams')}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-900 dark:to-success-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="h-7 w-7 text-success-600 dark:text-success-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors">
                    聊天室
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    选择团队开始聊天
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
                    设置
                  </h3>
                  <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                    个人和应用设置
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 开发进度 */}
          <div className="card p-6 animate-fade-in animate-delay-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                🚀 开发进度
              </h2>
              <span className="badge badge-success">95% 完成</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: '用户认证系统', completed: true },
                { name: '团队管理功能', completed: true },
                { name: '团队成员管理', completed: true },
                { name: '频道管理', completed: true },
                { name: '实时聊天', completed: true },
                { name: 'WebSocket实时通信', completed: true },
                { name: '个人设置页面', completed: true },
                { name: 'UI优化升级', completed: true, isNew: true },
              ].map((item, index) => (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-dark-800 hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${item.completed ? 'bg-success-500' : 'bg-secondary-300'}`} />
                    <span className="text-secondary-700 dark:text-secondary-300 text-sm">
                      {item.name}
                      {item.isNew && <span className="ml-2 badge badge-primary text-xs">新增</span>}
                    </span>
                  </div>
                  {item.completed && (
                    <span className="text-success-600 dark:text-success-400 font-medium text-sm">
                      ✓ 已完成
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* 进度条 */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary-600 dark:text-secondary-400">总体进度</span>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">95%</span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-success-500 to-primary-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: '95%' }}
                />
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
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
