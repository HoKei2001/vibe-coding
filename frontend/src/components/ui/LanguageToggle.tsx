import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const currentFlag = language === 'zh' ? '🇨🇳' : '🇺🇸';
  const currentLabel = language === 'zh' ? '中文' : 'EN';

  return (
    <button
      onClick={toggleLanguage}
      className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded-lg
        bg-white dark:bg-dark-800 
        border border-secondary-200 dark:border-dark-700
        text-secondary-700 dark:text-secondary-300
        hover:bg-secondary-50 dark:hover:bg-dark-700
        hover:border-secondary-300 dark:hover:border-dark-600
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-all duration-200
        shadow-sm hover:shadow
        ${className}
      `}
      title={`切换语言 / Switch Language`}
    >
      <span className="text-sm">{currentFlag}</span>
      <span className="text-xs font-medium hidden sm:inline">{currentLabel}</span>
      <Globe className="h-3 w-3 opacity-60" />
    </button>
  );
};

export default LanguageToggle; 