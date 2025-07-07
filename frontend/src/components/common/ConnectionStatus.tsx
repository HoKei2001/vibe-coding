import React from 'react';
import { useAppSelector } from '../../hooks/redux';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { connectionState, lastError } = useAppSelector((state) => state.websocket);

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4 text-green-600" />,
          text: '已连接',
          className: 'bg-green-50 text-green-700 border-green-200',
          show: false, // 连接成功时不显示
        };
      case 'connecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
          text: '连接中...',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          show: true,
        };
      case 'reconnecting':
        return {
          icon: <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />,
          text: '重连中...',
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          show: true,
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4 text-red-600" />,
          text: '连接断开',
          className: 'bg-red-50 text-red-700 border-red-200',
          show: true,
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-gray-600" />,
          text: '未知状态',
          className: 'bg-gray-50 text-gray-700 border-gray-200',
          show: true,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 如果不需要显示状态，返回null
  if (!statusInfo.show) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-lg border ${statusInfo.className} shadow-lg`}>
      {statusInfo.icon}
      <span className="text-sm font-medium">{statusInfo.text}</span>
      {lastError && connectionState === 'disconnected' && (
        <div className="ml-2 text-xs text-red-600">
          {lastError}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 