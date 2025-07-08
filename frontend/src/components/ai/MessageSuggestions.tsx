import React, { useState, useEffect } from 'react';
import { Sparkles, ThumbsUp, Copy, X, Loader2 } from 'lucide-react';
import { AIService, type MessageSuggestionRequest, type MessageSuggestionResponse } from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface MessageSuggestionsProps {
  channelId: number;
  topic?: string;
  context?: string;
  isVisible: boolean;
  onClose: () => void;
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({
  channelId,
  topic,
  context,
  isVisible,
  onClose,
  onSelectSuggestion,
  className = ''
}) => {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<MessageSuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && channelId) {
      fetchSuggestions();
    }
  }, [isVisible, channelId, topic, context]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request: MessageSuggestionRequest = {
        channel_id: channelId,
        topic,
        context
      };
      
      const response = await AIService.getMessageSuggestions(request);
      setSuggestions(response);
    } catch (err) {
      setError('获取消息建议失败');
      console.error('获取消息建议失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    // 记录使用情况
    AIService.reportSuggestionUsage(channelId, suggestion, true);
    onClose();
  };

  const handleCopySuggestion = async (suggestion: string) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      // 这里可以添加复制成功的提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const getQualityColor = (confidence: number) => {
    const quality = AIService.evaluateSuggestionQuality(confidence);
    switch (quality) {
      case 'high': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-red-600 dark:text-red-400';
      default: return 'text-secondary-600 dark:text-secondary-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`ai-suggestions-container ${className}`}>
      <div className="bg-white dark:bg-dark-800 border border-primary-200 dark:border-primary-700 rounded-lg shadow-lg p-4 min-w-80 max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              AI智能建议
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
          </button>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600 dark:text-primary-400" />
            <span className="ml-2 text-secondary-600 dark:text-secondary-400">
              AI正在分析上下文...
            </span>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchSuggestions}
              className="btn btn-primary btn-sm"
            >
              重试
            </button>
          </div>
        )}

        {/* 建议列表 */}
        {suggestions && !loading && !error && (
          <div className="space-y-3">
            {/* 置信度指示器 */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-secondary-500 dark:text-secondary-400">
                AI置信度:
              </span>
              <span className={getQualityColor(suggestions.confidence)}>
                {Math.round(suggestions.confidence * 100)}%
              </span>
              <span className="text-secondary-400 dark:text-secondary-500">
                • 基于{suggestions.context_used}条上下文
              </span>
            </div>

            {/* 建议项 */}
            {suggestions.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="group border border-secondary-200 dark:border-dark-600 rounded-lg p-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex items-start justify-between">
                  <p className="text-secondary-800 dark:text-secondary-200 text-sm flex-1 pr-2">
                    {suggestion}
                  </p>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySuggestion(suggestion);
                      }}
                      className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
                      title="复制"
                    >
                      <Copy className="h-3 w-3 text-secondary-500 dark:text-secondary-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSuggestion(suggestion);
                      }}
                      className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
                      title="使用此建议"
                    >
                      <ThumbsUp className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 底部说明 */}
            <div className="text-xs text-secondary-500 dark:text-secondary-400 pt-2 border-t border-secondary-200 dark:border-dark-600">
              💡 点击建议直接使用，或点击复制图标复制到剪贴板
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSuggestions; 