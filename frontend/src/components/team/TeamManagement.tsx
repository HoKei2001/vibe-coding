import React, { useState } from 'react';
import TeamList from './TeamList';
import CreateTeamForm from './CreateTeamForm';
import Navigation from '../common/Navigation';

const TeamManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        title="团队管理" 
        showBackButton={true} 
        backTo="/dashboard" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">管理您的团队和成员</p>
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