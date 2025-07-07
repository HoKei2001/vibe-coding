import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center p-2 
        rounded-lg transition-all duration-200 
        hover:bg-secondary-100 dark:hover:bg-dark-700
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}模式`}
      title={`切换到${theme === 'light' ? '深色' : '浅色'}模式`}
    >
      <div className="relative w-5 h-5">
        {/* 太阳图标 */}
        <Sun 
          className={`
            absolute inset-0 h-5 w-5 transform transition-all duration-300
            ${theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
            }
          `}
        />
        
        {/* 月亮图标 */}
        <Moon 
          className={`
            absolute inset-0 h-5 w-5 transform transition-all duration-300
            ${theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
            }
          `}
        />
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'light' ? '浅色模式' : '深色模式'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle; 