import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Monitor, Sun, Moon, Palette, Type, Zap } from 'lucide-react';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: '浅色模式',
      description: '经典的明亮界面',
      icon: Sun,
      preview: 'bg-white border-gray-200',
    },
    {
      value: 'dark' as const,
      label: '深色模式',
      description: '对眼睛更友好的深色界面',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
    },
  ];

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-secondary-200 dark:border-dark-700">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">外观设置</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">自定义您的界面外观和体验</p>
      </div>

      <div className="p-6 space-y-8">
        {/* 主题设置 */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="text-base font-medium text-secondary-900 dark:text-secondary-100">
              主题模式
            </h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20' 
                      : 'border-secondary-200 dark:border-dark-700 hover:border-secondary-300 dark:hover:border-dark-600 bg-white dark:bg-dark-800'
                    }
                  `}
                >
                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* 预览区域 */}
                    <div className={`w-12 h-12 rounded-lg border ${option.preview} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${option.value === 'light' ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                    
                    {/* 文本内容 */}
                    <div className="flex-1">
                      <h5 className={`font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-900 dark:text-secondary-100'}`}>
                        {option.label}
                      </h5>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 字体设置 */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Type className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="text-base font-medium text-secondary-900 dark:text-secondary-100">
              字体设置
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                字体大小
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['小', '中', '大'].map((size, index) => (
                  <button
                    key={size}
                    className={`
                      p-3 rounded-lg border transition-all duration-200
                      ${index === 1 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'border-secondary-200 dark:border-dark-700 hover:border-secondary-300 dark:hover:border-dark-600 text-secondary-700 dark:text-secondary-300'
                      }
                    `}
                  >
                    <span className={`font-medium ${index === 0 ? 'text-sm' : index === 1 ? 'text-base' : 'text-lg'}`}>
                      {size}字体
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 动画设置 */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h4 className="text-base font-medium text-secondary-900 dark:text-secondary-100">
              动画效果
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-dark-800 rounded-lg">
              <div>
                <h5 className="font-medium text-secondary-900 dark:text-secondary-100">启用动画</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  页面切换和交互动画效果
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-dark-800 rounded-lg">
              <div>
                <h5 className="font-medium text-secondary-900 dark:text-secondary-100">减少动画</h5>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  为敏感用户减少动画效果
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 预览提示 */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-start space-x-3">
            <Monitor className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h5 className="font-medium text-primary-900 dark:text-primary-100">提示</h5>
              <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                主题切换会立即生效。其他设置将在未来版本中提供更多自定义选项。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings; 