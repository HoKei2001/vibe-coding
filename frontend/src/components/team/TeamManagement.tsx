import React, { useState } from 'react';
import TeamList from './TeamList';
import CreateTeamForm from './CreateTeamForm';
import Navigation from '../common/Navigation';
import { useLanguage } from '../../contexts/LanguageContext';

const TeamManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { t } = useLanguage();

  const handleCreateTeam = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    // 表单提交成功后的回调
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-dark-950 transition-colors duration-300">
      <Navigation 
        title={t('teams.title')} 
        showBackButton={true} 
        backTo="/dashboard" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-secondary-600 dark:text-secondary-400">
            {t('dashboard.teams.description')}
          </p>
        </div>

        <TeamList onCreateTeam={handleCreateTeam} />

        {showCreateForm && (
          <CreateTeamForm
            onClose={handleCloseCreateForm}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default TeamManagement; 