import React, { useState, useEffect, useRef } from 'react';
import { Search, Brain, Clock, User, Hash, Sparkles, ArrowRight, X, Filter } from 'lucide-react';
import { AIService, type SmartSearchRequest, type SmartSearchResponse, type SearchResult } from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface SmartSearchProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
  className?: string;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  isVisible,
  onClose,
  onSelectResult,
  className = ''
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SmartSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // 搜索过滤器
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | '1d' | '1w' | '1m'>('all');
  const [searchType, setSearchType] = useState<'semantic' | 'keyword' | 'mixed'>('semantic');
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    // 加载搜索历史
    const history = localStorage.getItem('huddle-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query.trim());
      }, 500);
    } else {
      setResults(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedChannels, timeRange, searchType]);

  const getTimeRangeFilter = () => {
    if (timeRange === 'all') return undefined;
    
    const now = new Date();
    let start: Date;
    
    switch (timeRange) {
      case '1d':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return undefined;
    }
    
    return {
      start: AIService.formatTimeForAPI(start),
      end: AIService.formatTimeForAPI(now)
    };
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const request: SmartSearchRequest = {
        query: searchQuery,
        channels: selectedChannels.length > 0 ? selectedChannels : undefined,
        time_range: getTimeRangeFilter(),
        search_type: searchType
      };
      
      const response = await AIService.intelligentSearch(request);
      setResults(response);
      
      // 保存到搜索历史
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('huddle-search-history', JSON.stringify(newHistory));
      
    } catch (err) {
      setError('搜索失败，请稍后重试');
      console.error('智能搜索失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'semantic': return <Brain className="h-4 w-4" />;
      case 'keyword': return <Search className="h-4 w-4" />;
      case 'mixed': return <Sparkles className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getSearchTypeLabel = (type: string) => {
    const labels = {
      semantic: '语义搜索',
      keyword: '关键词搜索', 
      mixed: '混合搜索'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };

  if (!isVisible) return null;

  return (
    <div className={`smart-search-container ${className}`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
          {/* 搜索头部 */}
          <div className="p-6 border-b border-secondary-200 dark:border-dark-700">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <div className="flex items-center space-x-2 p-3 border border-secondary-300 dark:border-dark-600 rounded-lg bg-secondary-50 dark:bg-dark-700">
                  <Brain className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="智能搜索消息内容、用户、频道..."
                    className="flex-1 bg-transparent border-none outline-none text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400"
                  />
                  {loading && (
                    <div className="animate-spin">
                      <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-lg border transition-colors ${
                  showFilters
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-secondary-300 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-3 rounded-lg border border-secondary-300 dark:border-dark-600 hover:border-red-300 dark:hover:border-red-600 text-secondary-600 dark:text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 搜索过滤器 */}
            {showFilters && (
              <div className="mt-4 p-4 bg-secondary-50 dark:bg-dark-700 rounded-lg space-y-4">
                {/* 搜索类型 */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    搜索类型
                  </label>
                  <div className="flex space-x-2">
                    {(['semantic', 'keyword', 'mixed'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSearchType(type)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          searchType === type
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                      >
                        {getSearchTypeIcon(type)}
                        <span>{getSearchTypeLabel(type)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 时间范围 */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    时间范围
                  </label>
                  <div className="flex space-x-2">
                    {([
                      { value: 'all', label: '全部时间' },
                      { value: '1d', label: '最近1天' },
                      { value: '1w', label: '最近1周' },
                      { value: '1m', label: '最近1月' }
                    ] as const).map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          timeRange === range.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-secondary-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 搜索内容区域 */}
          <div className="flex-1 overflow-y-auto max-h-[60vh]">
            {/* 搜索历史 */}
            {!query && searchHistory.length > 0 && (
              <div className="p-6">
                <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                  最近搜索
                </h3>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(historyItem)}
                      className="flex items-center space-x-2 px-3 py-2 bg-secondary-100 dark:bg-dark-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-dark-600 transition-colors text-sm"
                    >
                      <Clock className="h-3 w-3 text-secondary-500 dark:text-secondary-400" />
                      <span className="text-secondary-700 dark:text-secondary-300">{historyItem}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 搜索结果 */}
            {results && (
              <div className="p-6">
                {/* 搜索统计和理解 */}
                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSearchTypeIcon(results.search_type)}
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {getSearchTypeLabel(results.search_type)} • 找到 {results.total_count} 条结果
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-primary-600 dark:text-primary-400">
                    {results.query_understanding}
                  </p>
                </div>

                {/* 搜索建议 */}
                {results.suggestions && results.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                      相关搜索建议
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(suggestion)}
                          className="flex items-center space-x-1 px-3 py-2 bg-secondary-100 dark:bg-dark-700 rounded-lg hover:bg-secondary-200 dark:hover:bg-dark-600 transition-colors text-sm"
                        >
                          <ArrowRight className="h-3 w-3 text-secondary-500 dark:text-secondary-400" />
                          <span className="text-secondary-700 dark:text-secondary-300">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 搜索结果列表 */}
                <div className="space-y-4">
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="group p-4 border border-secondary-200 dark:border-dark-600 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
                    >
                      {/* 结果头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
                          <Hash className="h-4 w-4" />
                          <span>{result.channel_name}</span>
                          <span>•</span>
                          <User className="h-4 w-4" />
                          <span>{result.author}</span>
                          <span>•</span>
                          <Clock className="h-4 w-4" />
                          <span>{formatTimestamp(result.timestamp)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                            {Math.round(result.relevance_score * 100)}% 相关
                          </span>
                        </div>
                      </div>

                      {/* 消息内容 */}
                      <div className="text-secondary-800 dark:text-secondary-200">
                        {result.highlight ? (
                          <div dangerouslySetInnerHTML={{ __html: result.highlight }} />
                        ) : (
                          <span>{highlightText(result.content, query)}</span>
                        )}
                      </div>

                      {/* 操作提示 */}
                      <div className="mt-2 text-xs text-secondary-500 dark:text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        点击跳转到消息
                      </div>
                    </div>
                  ))}
                </div>

                {/* 无结果 */}
                {results.results.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                      未找到相关结果
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                      尝试使用不同的关键词或调整搜索设置
                    </p>
                    <button
                      onClick={() => setShowFilters(true)}
                      className="btn btn-primary btn-sm"
                    >
                      调整搜索设置
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 错误状态 */}
            {error && (
              <div className="p-6 text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => performSearch(query)}
                  className="btn btn-primary"
                >
                  重试
                </button>
              </div>
            )}

            {/* 空状态提示 */}
            {!query && !searchHistory.length && (
              <div className="p-12 text-center">
                <Brain className="h-16 w-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  AI智能搜索
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  使用自然语言描述您要找的内容，AI会理解您的意图并提供精准结果
                </p>
                <div className="text-sm text-secondary-500 dark:text-secondary-400 space-y-1">
                  <p>💡 例如："关于项目进度的讨论"</p>
                  <p>💡 例如："张三提到的技术方案"</p>
                  <p>💡 例如："上周的重要决定"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearch; 