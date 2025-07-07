import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { sendMessage } from '../../store/slices/messageSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { 
  Send, 
  Plus, 
  Paperclip, 
  Smile, 
  X,
  Reply
} from 'lucide-react';
import type { Message } from '../../types';

interface MessageInputProps {
  channelId: number;
  replyToMessage?: Message;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  channelId, 
  replyToMessage, 
  onCancelReply 
}) => {
  const dispatch = useAppDispatch();
  const { sendingMessage } = useAppSelector((state) => state.messages);
  const { connectionState } = useAppSelector((state) => state.websocket);
  const { user } = useAppSelector((state) => state.auth);
  
  const [content, setContent] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebSocket hook
  const { startTyping, stopTyping } = useWebSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || sendingMessage) return;

    const messageData = {
      content: content.trim(),
      parent_id: replyToMessage?.id,
    };

    try {
      // 停止输入状态
      stopTyping(channelId);
      
      await dispatch(sendMessage({ channelId, messageData }));
      setContent('');
      onCancelReply?.();
      
      // 自动调整文本框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape' && replyToMessage) {
      onCancelReply?.();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // 自动调整文本框高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;

    // 处理输入状态
    if (connectionState === 'connected') {
      // 如果开始输入内容，发送正在输入状态
      if (e.target.value.trim() && !typingTimeoutRef.current) {
        startTyping(channelId);
      }
      
      // 清除之前的定时器
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // 如果有内容，设置新的定时器；如果没有内容，立即停止输入状态
      if (e.target.value.trim()) {
        typingTimeoutRef.current = setTimeout(() => {
          stopTyping(channelId);
          typingTimeoutRef.current = null;
        }, 1000); // 1秒后停止输入状态
      } else {
        stopTyping(channelId);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleFocus = () => {
    // 获得焦点时，如果有内容则开始输入状态
    if (content.trim() && connectionState === 'connected') {
      startTyping(channelId);
    }
  };

  const handleBlur = () => {
    // 失去焦点时停止输入状态
    if (connectionState === 'connected') {
      stopTyping(channelId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleAttachmentClick = () => {
    setShowAttachments(!showAttachments);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('文件上传功能待实现:', file);
      // TODO: 实现文件上传功能
    }
  };

  // 检查是否可以发送消息
  const canSendMessage = content.trim() && !sendingMessage && connectionState === 'connected';

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* 回复提示 */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Reply className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              回复 <span className="font-semibold">{replyToMessage.author.full_name || replyToMessage.author.username}</span>
            </span>
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {replyToMessage.content}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 附件选项 */}
      {showAttachments && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
              <Paperclip className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">上传文件</span>
            </label>
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* 附件按钮 */}
          <button
            type="button"
            onClick={handleAttachmentClick}
            className={`p-2 rounded-lg transition-colors ${
              showAttachments 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Plus className="h-5 w-5" />
          </button>

          {/* 输入框 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={replyToMessage ? '回复消息...' : '输入消息...'}
              className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
                connectionState === 'connected' 
                  ? 'border-gray-300 focus:ring-blue-500' 
                  : 'border-red-300 focus:ring-red-500'
              }`}
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={sendingMessage || connectionState !== 'connected'}
            />
            
            {/* 表情按钮 */}
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                console.log('表情选择功能待实现');
                // TODO: 实现表情选择功能
              }}
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          {/* 发送按钮 */}
          <button
            type="submit"
            disabled={!canSendMessage}
            className={`p-2 rounded-lg transition-colors ${
              canSendMessage
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

        {/* 提示文本 */}
        <div className="mt-2 text-xs text-gray-500">
          按 Enter 发送，Shift + Enter 换行
          {replyToMessage && '，按 Escape 取消回复'}
          {connectionState !== 'connected' && (
            <span className="text-red-500 ml-2">
              • 连接断开，无法发送消息
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 