import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateMessage, deleteMessage } from '../../store/slices/messageSlice';
import { 
  Edit, 
  Trash2, 
  Reply, 
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  onReply?: (message: Message) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onReply }) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await dispatch(updateMessage({ messageId: message.id, content: editContent.trim() }));
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这条消息吗？')) {
      await dispatch(deleteMessage(message.id));
    }
  };

  const handleReply = () => {
    onReply?.(message);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canModifyMessage = currentUser && (
    message.author_id === currentUser.id ||
    currentUser.id === message.author_id // 简化权限检查
  );

  return (
    <div 
      className="group flex items-start space-x-3 p-3 hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 用户头像 */}
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
        {message.author.full_name?.charAt(0)?.toUpperCase() || 'U'}
      </div>

      {/* 消息内容 */}
      <div className="flex-1 min-w-0">
        {/* 用户信息和时间 */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {message.author.full_name || message.author.username}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {message.is_edited && (
            <span className="text-xs text-gray-400">(已编辑)</span>
          )}
        </div>

        {/* 消息内容 */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
              autoFocus
            />
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <Check className="h-3 w-3" />
                <span>保存</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
                <span>取消</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-900 text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* 附件 */}
        {message.attachment_url && (
          <div className="mt-2 p-3 bg-gray-100 rounded-lg border">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">附件:</span>
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {message.attachment_name || '查看附件'}
              </a>
              {message.attachment_size && (
                <span className="text-xs text-gray-500">
                  ({Math.round(message.attachment_size / 1024)}KB)
                </span>
              )}
            </div>
          </div>
        )}

        {/* 回复 */}
        {message.replies && message.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-gray-200">
            <div className="text-xs text-gray-500 mb-2">
              {message.replies.length} 条回复
            </div>
            {message.replies.slice(0, 3).map((reply) => (
              <div key={reply.id} className="mb-2 last:mb-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {reply.author.full_name || reply.author.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(reply.created_at)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {reply.content}
                </div>
              </div>
            ))}
            {message.replies.length > 3 && (
              <button className="text-xs text-blue-600 hover:text-blue-800">
                查看更多回复...
              </button>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {showActions && !isEditing && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleReply}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="回复"
          >
            <Reply className="h-4 w-4" />
          </button>
          
          {canModifyMessage && (
            <>
              <button
                onClick={handleEdit}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="编辑"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="更多"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageItem; 