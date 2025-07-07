import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Palette } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import ProfileSettings from './ProfileSettings';
import AppearanceSettings from './AppearanceSettings';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      name: t('settings.profile.title'),
      icon: User,
      description: t('settings.profile.description')
    },
    {
      id: 'security' as SettingsTab,
      name: t('settings.security.title'),
      icon: Shield,
      description: t('settings.security.description')
    },
    {
      id: 'notifications' as SettingsTab,
      name: t('settings.notifications.title'),
      icon: Bell,
      description: t('settings.notifications.description')
    },
    {
      id: 'appearance' as SettingsTab,
      name: t('settings.appearance.title'),
      icon: Palette,
      description: t('settings.appearance.description')
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'security':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.security.title')}</h3>
            <div className="text-gray-600">
              <p>{t('settings.security.description')}</p>
              <p className="mt-2 text-sm">
                {t('settings.security.note')}
              </p>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.notifications.title')}</h3>
            <div className="text-gray-600">
              <p>{t('settings.notifications.description')}</p>
              <p className="mt-2 text-sm">
                {t('settings.notifications.note')}
              </p>
            </div>
          </div>
        );
      case 'appearance':
        return <AppearanceSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-dark-900 shadow-sm border-b border-secondary-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {t('settings.title')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto section-spacing container-padding">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                  {t('settings.title')}
                </h2>
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shadow-sm'
                            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-dark-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`h-5 w-5 transition-colors ${
                            isActive 
                              ? 'text-primary-600 dark:text-primary-400' 
                              : 'text-secondary-400 group-hover:text-secondary-600 dark:group-hover:text-secondary-300'
                          }`} />
                          <div className="text-left">
                            <div className={`font-medium text-sm ${isActive ? 'text-primary-700 dark:text-primary-300' : ''}`}>
                              {tab.name}
                            </div>
                            <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                              {tab.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 