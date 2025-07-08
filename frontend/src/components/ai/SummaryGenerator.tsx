import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Users, CheckSquare, Loader2, Download, Share2, X } from 'lucide-react';
import { AIService, type AutoSummaryRequest, type AutoSummaryResponse } from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface SummaryGeneratorProps {
  channelId: number;
  channelName?: string;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

const SummaryGenerator: React.FC<SummaryGeneratorProps> = ({
  channelId,
  channelName,
  isVisible,
  onClose,
  className = ''
}) => {
  const { t } = useLanguage();
  const [summary, setSummary] = useState<AutoSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 时间范围选择
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'custom'>('24h');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [summaryType, setSummaryType] = useState<'meeting' | 'discussion' | 'decision'>('meeting');

  useEffect(() => {
    if (isVisible) {
      // 设置默认时间范围
      const now = new Date();
      const end = now.toISOString().slice(0, 16);
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      
      setCustomStartTime(start);
      setCustomEndTime(end);
    }
  }, [isVisible]);

  const getTimeRangeLabel = (range: string) => {
    const labels = {
      '1h': '最近1小时',
      '6h': '最近6小时', 
      '24h': '最近24小时',
      'custom': '自定义时间'
    };
    return labels[range as keyof typeof labels] || range;
  };

  const getTimeRange = () => {
    const now = new Date();
    let start: Date;
    let end = now;

    switch (timeRange) {
      case '1h':
        start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '6h':
        start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        start = new Date(customStartTime);
        end = new Date(customEndTime);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return {
      start_time: AIService.formatTimeForAPI(start),
      end_time: AIService.formatTimeForAPI(end)
    };
  };

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { start_time, end_time } = getTimeRange();
      
      const request: AutoSummaryRequest = {
        channel_id: channelId,
        start_time,
        end_time,
        summary_type: summaryType
      };
      
      const response = await AIService.generateAutoSummary(request);
      setSummary(response);
    } catch (err) {
      setError('生成摘要失败，请稍后重试');
      console.error('生成摘要失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportSummary = () => {
    if (!summary) return;
    
    const content = `
# ${channelName || '频道'} 会议摘要

**生成时间**: ${new Date().toLocaleString()}
**消息数量**: ${summary.message_count}条
**参与人员**: ${summary.participants.join('、')}

## 主要内容
${summary.summary}

## 关键要点
${summary.key_points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

${summary.action_items.length > 0 ? `
## 行动项目
${summary.action_items.map((item, index) => `${index + 1}. ${item}`).join('\n')}
` : ''}

---
由 Huddle Up AI 生成
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${channelName || '频道'}_摘要_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareSummary = async () => {
    if (!summary) return;
    
    const shareText = `${channelName || '频道'} 会议摘要\n\n${summary.summary}\n\n由 Huddle Up AI 生成`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${channelName || '频道'} 会议摘要`,
          text: shareText
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      // 降级到复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareText);
        // 这里可以添加复制成功的提示
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`summary-generator-container ${className}`}>
      <div className="bg-white dark:bg-dark-800 border border-secondary-200 dark:border-dark-700 rounded-lg shadow-lg">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                AI自动摘要
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {channelName ? `为 ${channelName} 生成智能摘要` : '生成频道讨论摘要'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-dark-700 transition-colors"
          >
            <X className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
          </button>
        </div>

        <div className="p-6">
          {/* 设置区域 */}
          {!summary && (
            <div className="space-y-6 mb-6">
              {/* 时间范围选择 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  选择时间范围
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(['1h', '6h', '24h', 'custom'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        timeRange === range
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      {getTimeRangeLabel(range)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义时间范围 */}
              {timeRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      开始时间
                    </label>
                    <input
                      type="datetime-local"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full p-2 border border-secondary-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-secondary-900 dark:text-secondary-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      结束时间
                    </label>
                    <input
                      type="datetime-local"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      className="w-full p-2 border border-secondary-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-secondary-900 dark:text-secondary-100"
                    />
                  </div>
                </div>
              )}

              {/* 摘要类型选择 */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  摘要类型
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {([
                    { value: 'meeting', label: '会议纪要', desc: '结构化会议记录' },
                    { value: 'discussion', label: '讨论总结', desc: '话题讨论要点' },
                    { value: 'decision', label: '决策记录', desc: '重要决定和结论' }
                  ] as const).map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSummaryType(type.value)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        summaryType === type.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }`}
                    >
                      <div className="font-medium text-secondary-900 dark:text-secondary-100">
                        {type.label}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {type.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={generateSummary}
                disabled={loading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI正在分析并生成摘要...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>生成AI摘要</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={generateSummary}
                className="btn btn-primary"
              >
                重新生成
              </button>
            </div>
          )}

          {/* 摘要结果 */}
          {summary && (
            <div className="space-y-6">
              {/* 操作按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{summary.message_count} 条消息</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{summary.participants.length} 人参与</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={shareSummary}
                    className="btn btn-secondary btn-sm flex items-center space-x-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>分享</span>
                  </button>
                  <button
                    onClick={exportSummary}
                    className="btn btn-primary btn-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>导出</span>
                  </button>
                </div>
              </div>

              {/* 主要摘要 */}
              <div className="bg-secondary-50 dark:bg-dark-900 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                  📄 主要内容
                </h3>
                <p className="text-secondary-700 dark:text-secondary-300 leading-relaxed">
                  {summary.summary}
                </p>
              </div>

              {/* 关键要点 */}
              {summary.key_points.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center space-x-2">
                    <span>🎯</span>
                    <span>关键要点</span>
                  </h3>
                  <ul className="space-y-2">
                    {summary.key_points.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-white dark:bg-dark-700 rounded-lg border border-secondary-200 dark:border-dark-600"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-secondary-700 dark:text-secondary-300">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 行动项目 */}
              {summary.action_items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center space-x-2">
                    <CheckSquare className="h-5 w-5" />
                    <span>行动项目</span>
                  </h3>
                  <ul className="space-y-2">
                    {summary.action_items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
                      >
                        <CheckSquare className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700 dark:text-secondary-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 参与人员 */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3 flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>参与人员</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.participants.map((participant, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                    >
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {/* 重新生成按钮 */}
              <button
                onClick={() => setSummary(null)}
                className="w-full btn btn-secondary"
              >
                重新生成摘要
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryGenerator; 