import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { getUserTeams, setCurrentTeam, clearError } from '../../store/slices/teamSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users, Settings, Plus, MoreHorizontal, Eye } from 'lucide-react';
import type { Team } from '../../types';

interface TeamListProps {
  onCreateTeam: () => void;
}

const TeamList: React.FC<TeamListProps> = ({ onCreateTeam }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { teams, isLoading, error, currentTeam } = useAppSelector((state) => state.teams);

  useEffect(() => {
    dispatch(getUserTeams());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleTeamClick = (team: Team) => {
    dispatch(setCurrentTeam(team));
    navigate(`/teams/${team.id}`);
  };

  const getTeamInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-secondary-200 dark:bg-dark-700 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-200 dark:bg-dark-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-200 dark:bg-dark-700 rounded w-2/3"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-dark-700 rounded w-1/2 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-md border border-secondary-200 dark:border-dark-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {t('teams.list.title')}
          </h2>
          <button
            onClick={onCreateTeam}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('teams.create')}</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-3" />
            <p className="text-secondary-500 dark:text-secondary-400 mb-4">
              {t('teams.list.empty')}
            </p>
            <button
              onClick={onCreateTeam}
              className="btn btn-primary"
            >
              {t('teams.list.create_first')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 ${
                  currentTeam?.id === team.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-secondary-200 dark:border-dark-600'
                }`}
                onClick={() => handleTeamClick(team)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {getTeamInitials(team.name)}
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                        {team.name}
                      </h3>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
                        {team.description}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 添加团队菜单
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4 text-secondary-400 dark:text-secondary-500" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {team.members && team.members.length > 0 
                        ? t('teams.members.count', { count: team.members.length })
                        : t('teams.members')
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{t('teams.list.view_details')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamList; 