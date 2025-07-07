import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleBack = () => {
    navigate(backTo);
  };

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">Huddle Up</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{t('dashboard.welcome')}, {user?.username}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation; 