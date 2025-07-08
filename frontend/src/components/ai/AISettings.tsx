import React, { useState, useEffect } from 'react';
import { Brain, Settings, Save, RotateCcw, Sparkles, MessageSquare, FileText, Search } from 'lucide-react';
import { AIService, type AIConfig } from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface AISettingsProps {
  className?: string;
}

const AISettings: React.FC<AISettingsProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<AIConfig>({
    enable_suggestions: true,
    enable_auto_summary: true,
    enable_smart_search: true,
    suggestion_sensitivity: 0.7,
    language_preference: 'zh'
  });
  const [originalConfig, setOriginalConfig] = useState<AIConfig>(config);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadAIConfig();
  }, []);

  useEffect(() => {
    // 检查是否有变更
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  const loadAIConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AIService.getAIConfig();
      const loadedConfig = {
        enable_suggestions: response.enable_suggestions,
        enable_auto_summary: response.enable_auto_summary,
        enable_smart_search: response.enable_smart_search,
        suggestion_sensitivity: response.suggestion_sensitivity,
        language_preference: response.language_preference
      };
      setConfig(loadedConfig);
      setOriginalConfig(loadedConfig);
    } catch (err) {
      setError('加载AI配置失败');
      console.error('加载AI配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    
    try {
      await AIService.updateAIConfig(config);
      setOriginalConfig(config);
      // 这里可以添加保存成功的提示
    } catch (err) {
      setError('保存AI配置失败');
      console.error('保存AI配置失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    setConfig(originalConfig);
  };

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSensitivityLabel = (value: number) => {
    if (value >= 0.8) return '高敏感度 - 更严格的建议筛选';
    if (value >= 0.6) return '中等敏感度 - 平衡的建议质量';
    if (value >= 0.4) return '低敏感度 - 更多建议选项';
    return '最低敏感度 - 包含所有可能建议';
  };

  if (loading) {
    return (
      <div className={`ai-settings-loading ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <Brain className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="ml-3 text-secondary-600 dark:text-secondary-400">
            加载AI设置中...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-settings-container ${className}`}>
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-secondary-200 dark:border-dark-700 p-6">
        {/* 头部 */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
              AI智能功能设置
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              自定义您的AI助手偏好和功能开关
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* AI功能开关 */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
              功能开关
            </h3>
            <div className="space-y-4">
              {/* 智能消息建议 */}
              <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-dark-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      智能消息建议
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      根据上下文为您提供回复建议
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_suggestions}
                    onChange={(e) => handleConfigChange('enable_suggestions', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* 自动摘要生成 */}
              <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-dark-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      自动摘要生成
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      自动生成会议纪要和讨论摘要
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_auto_summary}
                    onChange={(e) => handleConfigChange('enable_auto_summary', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* 智能搜索 */}
              <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-dark-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      智能语义搜索
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      理解搜索意图，提供更精准的结果
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_smart_search}
                    onChange={(e) => handleConfigChange('enable_smart_search', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* AI参数设置 */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
              智能参数
            </h3>
            
            {/* 建议敏感度 */}
            <div className="p-4 border border-secondary-200 dark:border-dark-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                    消息建议敏感度
                  </h4>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    调整AI建议的质量门槛
                  </p>
                </div>
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {Math.round(config.suggestion_sensitivity * 100)}%
                </span>
              </div>
              
              <div className="space-y-3">
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.1"
                  value={config.suggestion_sensitivity}
                  onChange={(e) => handleConfigChange('suggestion_sensitivity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer dark:bg-secondary-700 slider"
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {getSensitivityLabel(config.suggestion_sensitivity)}
                </p>
              </div>
            </div>
          </div>

          {/* 语言偏好 */}
          <div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
              语言偏好
            </h3>
            <div className="p-4 border border-secondary-200 dark:border-dark-600 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleConfigChange('language_preference', 'zh')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    config.language_preference === 'zh'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  <div className="font-medium">中文 (简体)</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">
                    AI将使用中文进行交互和回复
                  </div>
                </button>
                
                <button
                  onClick={() => handleConfigChange('language_preference', 'en')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    config.language_preference === 'en'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  <div className="font-medium">English</div>
                  <div className="text-sm text-secondary-600 dark:text-secondary-400">
                    AI will interact and respond in English
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* AI使用提示 */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                  AI功能使用提示
                </h4>
                <ul className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
                  <li>• 智能建议会根据您的写作风格个性化调整</li>
                  <li>• 自动摘要可以帮您快速了解错过的讨论</li>
                  <li>• 语义搜索理解您的意图，不只是匹配关键词</li>
                  <li>• 所有AI功能都在本地处理，确保数据安全</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-secondary-200 dark:border-dark-700">
          {hasChanges && (
            <button
              onClick={resetConfig}
              disabled={saving}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>重置</span>
            </button>
          )}
          
          <button
            onClick={saveConfig}
            disabled={!hasChanges || saving}
            className="btn btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin">
                  <Settings className="h-4 w-4" />
                </div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>保存设置</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings; 