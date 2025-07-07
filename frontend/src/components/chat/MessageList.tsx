import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  getChannelMessages, 
  setCurrentChannel, 
  clearMessages 
} from '../../store/slices/messageSlice';
import MessageItem from './MessageItem';
import { 
  ChevronDown, 
  Loader2, 
  MessageSquare 
} from 'lucide-react';
import type { Message } from '../../types';

interface MessageListProps {
  channelId: number;
  onReply?: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({ channelId, onReply }) => {
  const dispatch = useAppDispatch();
  const { 
    currentMessages, 
    isLoading, 
    error, 
    hasMore,
    currentChannelId 
  } = useAppSelector((state) => state.messages);
  
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  // 初始化频道消息
  useEffect(() => {
    if (channelId !== currentChannelId) {
      dispatch(setCurrentChannel(channelId));
      dispatch(getChannelMessages({ channelId }));
    }
  }, [channelId, currentChannelId, dispatch]);

  // 自动滚动到底部（仅当用户在底部附近时）
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages, isNearBottom]);

  // 监听滚动事件
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // 判断是否接近底部
      const nearBottom = distanceFromBottom < 100;
      setIsNearBottom(nearBottom);
      setShowScrollToBottom(!nearBottom && scrollTop > 200);

      // 加载更多消息（当滚动到顶部时）
      if (scrollTop < 100 && hasMore && !isLoading && !loadingMoreRef.current) {
        loadingMoreRef.current = true;
        const oldestMessage = currentMessages[0];
        if (oldestMessage) {
          dispatch(getChannelMessages({ 
            channelId, 
            beforeMessageId: oldestMessage.id,
            limit: 20
          })).finally(() => {
            loadingMoreRef.current = false;
          });
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [channelId, currentMessages, hasMore, isLoading, dispatch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(currentMessages);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">加载消息失败</div>
          <button
            onClick={() => dispatch(getChannelMessages({ channelId }))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* 消息列表 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* 加载更多指示器 */}
        {isLoading && hasMore && currentMessages.length > 0 && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <span className="ml-2 text-sm text-gray-500">加载更多消息...</span>
          </div>
        )}

        {/* 消息内容 */}
        {currentMessages.length === 0 && !isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-96">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                还没有消息
              </h3>
              <p className="text-gray-500">
                成为第一个在这个频道发送消息的人！
              </p>
            </div>
          </div>
        ) : (
          <div className="pb-4">
            {Object.entries(messageGroups).map(([date, messages]) => (
              <div key={date}>
                {/* 日期分隔符 */}
                <div className="flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className="px-4 text-sm text-gray-500 bg-white">
                    {date}
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                
                {/* 该日期的消息 */}
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showAvatar = !prevMessage || 
                    prevMessage.author_id !== message.author_id ||
                    (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()) > 5 * 60 * 1000; // 5分钟间隔

                  return (
                    <MessageItem
                      key={message.id}
                      message={message}
                      onReply={onReply}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* 初始加载指示器 */}
        {isLoading && currentMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500">加载消息中...</p>
            </div>
          </div>
        )}

        {/* 底部锚点 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          title="滚动到底部"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList; 