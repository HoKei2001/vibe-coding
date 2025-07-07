import React from 'react';
import { useAppSelector } from '../../hooks/redux';

interface TypingIndicatorProps {
  channelId: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ channelId }) => {
  const { typingUsers } = useAppSelector((state) => state.websocket);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // 过滤当前频道的正在输入用户，排除当前用户
  const channelTypingUsers = typingUsers.filter(
    user => user.channelId === channelId && user.userId !== currentUser?.id
  );

  if (channelTypingUsers.length === 0) {
    return null;
  }

  const formatTypingText = (users: typeof channelTypingUsers) => {
    if (users.length === 1) {
      return `${users[0].username} 正在输入...`;
    } else if (users.length === 2) {
      return `${users[0].username} 和 ${users[1].username} 正在输入...`;
    } else {
      return `${users[0].username} 和其他 ${users.length - 1} 人正在输入...`;
    }
  };

  return (
    <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        {/* 动画点 */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* 输入文本 */}
        <span className="text-sm text-gray-600">
          {formatTypingText(channelTypingUsers)}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator; 