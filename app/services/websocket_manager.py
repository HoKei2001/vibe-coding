"""
WebSocket 连接管理器
处理 WebSocket 连接、断开和消息广播
"""
import json
import logging
from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # 存储活跃连接: {user_id: {channel_id: websocket}}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        # 用户频道映射: {user_id: {channel_id}}
        self.user_channels: Dict[int, Set[int]] = {}
        # 频道用户映射: {channel_id: {user_id}}
        self.channel_users: Dict[int, Set[int]] = {}
        # 用户信息缓存: {user_id: user_info}
        self.user_info_cache: Dict[int, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, channel_id: Optional[int] = None):
        """建立 WebSocket 连接（不调用accept，由路由处理）"""
        # 注意：不在这里调用 websocket.accept()，应该在路由中处理
        
        # 初始化用户连接字典
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
            self.user_channels[user_id] = set()
        
        # 如果指定了频道，将用户加入频道
        if channel_id:
            self.active_connections[user_id][channel_id] = websocket
            self.user_channels[user_id].add(channel_id)
            
            # 更新频道用户映射
            if channel_id not in self.channel_users:
                self.channel_users[channel_id] = set()
            self.channel_users[channel_id].add(user_id)
            
            logger.info(f"用户 {user_id} 连接到频道 {channel_id}")
            
            # 通知频道内其他用户有新用户上线
            await self.broadcast_to_channel(
                channel_id,
                {
                    "type": "user_online",
                    "data": {
                        "user_id": user_id,
                        "channel_id": channel_id,
                        "action": "join_channel"
                    },
                    "timestamp": datetime.now().isoformat()
                },
                exclude_user=user_id
            )
        else:
            # 全局连接（不特定于频道）
            self.active_connections[user_id][0] = websocket
            logger.info(f"用户 {user_id} 建立全局连接")
    
    async def disconnect(self, user_id: int, channel_id: Optional[int] = None):
        """断开 WebSocket 连接"""
        if user_id in self.active_connections:
            if channel_id and channel_id in self.active_connections[user_id]:
                # 断开特定频道连接
                del self.active_connections[user_id][channel_id]
                
                if channel_id in self.user_channels.get(user_id, set()):
                    self.user_channels[user_id].discard(channel_id)
                
                if channel_id in self.channel_users:
                    self.channel_users[channel_id].discard(user_id)
                    if not self.channel_users[channel_id]:
                        del self.channel_users[channel_id]
                
                logger.info(f"用户 {user_id} 从频道 {channel_id} 断开连接")
                
                # 通知频道内其他用户有用户离线
                await self.broadcast_to_channel(
                    channel_id,
                    {
                        "type": "user_offline",
                        "data": {
                            "user_id": user_id,
                            "channel_id": channel_id,
                            "action": "leave_channel"
                        },
                        "timestamp": datetime.now().isoformat()
                    },
                    exclude_user=user_id
                )
            else:
                # 断开所有连接
                if user_id in self.active_connections:
                    del self.active_connections[user_id]
                
                if user_id in self.user_channels:
                    # 从所有频道中移除用户
                    for channel_id in self.user_channels[user_id]:
                        if channel_id in self.channel_users:
                            self.channel_users[channel_id].discard(user_id)
                            if not self.channel_users[channel_id]:
                                del self.channel_users[channel_id]
                    del self.user_channels[user_id]
                
                if user_id in self.user_info_cache:
                    del self.user_info_cache[user_id]
                
                logger.info(f"用户 {user_id} 断开所有连接")

    async def handle_message(self, user_id: int, message: dict):
        """处理来自用户的消息"""
        message_type = message.get("type")
        data = message.get("data", {})
        
        logger.info(f"收到用户 {user_id} 的WebSocket消息: {message_type}, 数据: {data}")
        
        if message_type == "join_channel":
            channel_id = data.get("channel_id")
            if channel_id:
                # 用户加入频道的逻辑
                if user_id in self.active_connections and 0 in self.active_connections[user_id]:
                    websocket = self.active_connections[user_id][0]
                    
                    # 将用户加入频道
                    self.active_connections[user_id][channel_id] = websocket
                    self.user_channels[user_id].add(channel_id)
                    
                    # 更新频道用户映射
                    if channel_id not in self.channel_users:
                        self.channel_users[channel_id] = set()
                    self.channel_users[channel_id].add(user_id)
                    
                    logger.info(f"用户 {user_id} 已加入频道 {channel_id}")
                    logger.info(f"频道 {channel_id} 现在有用户: {list(self.channel_users[channel_id])}")
                    
                    # 通知频道内其他用户有新用户上线
                    await self.broadcast_to_channel(
                        channel_id,
                        {
                            "type": "user_online",
                            "data": {
                                "user_id": user_id,
                                "channel_id": channel_id,
                                "action": "join_channel"
                            },
                            "timestamp": datetime.now().isoformat()
                        },
                        exclude_user=user_id
                    )
        
        elif message_type == "leave_channel":
            channel_id = data.get("channel_id")
            if channel_id:
                await self.disconnect(user_id, channel_id)
                logger.info(f"用户 {user_id} 已离开频道 {channel_id}")
        
        elif message_type == "typing":
            channel_id = data.get("channel_id")
            if channel_id:
                await self.broadcast_to_channel(
                    channel_id,
                    {
                        "type": "user_typing",
                        "data": {
                            "user_id": user_id,
                            "channel_id": channel_id,
                            "is_typing": data.get("is_typing", False)
                        },
                        "timestamp": datetime.now().isoformat()
                    },
                    exclude_user=user_id
                )
        
        logger.info(f"处理用户 {user_id} 的消息: {message_type}")
    
    async def send_personal_message(self, message: dict, user_id: int, channel_id: Optional[int] = None):
        """发送个人消息"""
        if user_id in self.active_connections:
            if channel_id and channel_id in self.active_connections[user_id]:
                websocket = self.active_connections[user_id][channel_id]
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"发送消息给用户 {user_id} 失败: {e}")
                    self.disconnect(user_id, channel_id)
            elif 0 in self.active_connections[user_id]:
                # 发送到全局连接
                websocket = self.active_connections[user_id][0]
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"发送消息给用户 {user_id} 失败: {e}")
                    self.disconnect(user_id)
    
    async def broadcast_to_channel(self, channel_id: int, message: dict, exclude_user: Optional[int] = None):
        """广播消息到频道内所有用户"""
        logger.info(f"尝试向频道 {channel_id} 广播消息，类型: {message.get('type')}")
        
        # 获取频道内的用户，包括全局连接的用户
        users_to_broadcast = set()
        
        # 1. 添加明确加入频道的用户
        if channel_id in self.channel_users:
            users_to_broadcast.update(self.channel_users[channel_id])
            logger.info(f"频道 {channel_id} 明确加入的用户: {list(self.channel_users[channel_id])}")
        
        # 2. 添加所有全局连接的用户（这些用户可能在浏览频道但未明确加入）
        for user_id, connections in self.active_connections.items():
            if 0 in connections:  # 有全局连接
                users_to_broadcast.add(user_id)
        
        if not users_to_broadcast:
            logger.warning(f"频道 {channel_id} 没有可广播的用户，跳过广播")
            return
        
        logger.info(f"准备向频道 {channel_id} 的 {len(users_to_broadcast)} 个用户广播消息")
        disconnect_users = []
        broadcast_count = 0
        
        for user_id in users_to_broadcast:
            if exclude_user and user_id == exclude_user:
                logger.info(f"跳过排除的用户 {user_id}")
                continue
                
            if user_id not in self.active_connections:
                continue
            
            # 优先使用频道连接，如果没有则使用全局连接
            websocket = None
            if channel_id in self.active_connections[user_id]:
                websocket = self.active_connections[user_id][channel_id]
                logger.info(f"使用频道连接向用户 {user_id} 发送消息")
            elif 0 in self.active_connections[user_id]:
                websocket = self.active_connections[user_id][0]
                logger.info(f"使用全局连接向用户 {user_id} 发送消息")
            
            if websocket:
                try:
                    await websocket.send_text(json.dumps(message))
                    broadcast_count += 1
                    logger.info(f"成功向用户 {user_id} 广播消息")
                except Exception as e:
                    logger.error(f"广播消息到用户 {user_id} 失败: {e}")
                    disconnect_users.append(user_id)
            else:
                logger.warning(f"用户 {user_id} 没有可用的WebSocket连接")
        
        # 清理断开的连接
        for user_id in disconnect_users:
            await self.disconnect(user_id, channel_id)
        
        logger.info(f"向频道 {channel_id} 成功广播了 {broadcast_count} 条消息")
    
    async def broadcast_to_user_channels(self, user_id: int, message: dict):
        """广播消息到用户所有频道"""
        if user_id not in self.user_channels:
            return
        
        for channel_id in self.user_channels[user_id]:
            await self.broadcast_to_channel(channel_id, message, exclude_user=user_id)
    
    def get_channel_users(self, channel_id: int) -> List[int]:
        """获取频道内的用户列表"""
        return list(self.channel_users.get(channel_id, set()))
    
    def get_user_channels(self, user_id: int) -> List[int]:
        """获取用户加入的频道列表"""
        return list(self.user_channels.get(user_id, set()))
    
    def is_user_online(self, user_id: int, channel_id: Optional[int] = None) -> bool:
        """检查用户是否在线"""
        if user_id not in self.active_connections:
            return False
        
        if channel_id:
            return channel_id in self.active_connections[user_id]
        else:
            return len(self.active_connections[user_id]) > 0
    
    def get_online_users_count(self, channel_id: Optional[int] = None) -> int:
        """获取在线用户数量"""
        if channel_id:
            return len(self.channel_users.get(channel_id, set()))
        else:
            return len(self.active_connections)
    
    def set_user_info(self, user_id: int, user_info: dict):
        """缓存用户信息"""
        self.user_info_cache[user_id] = user_info
    
    def get_user_info(self, user_id: int) -> Optional[dict]:
        """获取缓存的用户信息"""
        return self.user_info_cache.get(user_id)
    
    def add_user_to_channel(self, user_id: int, channel_id: int):
        """将用户添加到频道"""
        if user_id not in self.active_connections:
            logger.warning(f"尝试将未连接的用户 {user_id} 添加到频道 {channel_id}")
            return
        
        # 确保用户频道集合存在
        if user_id not in self.user_channels:
            self.user_channels[user_id] = set()
        
        # 确保频道用户集合存在
        if channel_id not in self.channel_users:
            self.channel_users[channel_id] = set()
        
        # 添加映射关系
        self.user_channels[user_id].add(channel_id)
        self.channel_users[channel_id].add(user_id)
        
        # 如果用户有全局连接，复制到频道连接
        if 0 in self.active_connections[user_id]:
            websocket = self.active_connections[user_id][0]
            self.active_connections[user_id][channel_id] = websocket
        
        logger.info(f"用户 {user_id} 已添加到频道 {channel_id}")
        logger.info(f"频道 {channel_id} 现在有用户: {list(self.channel_users[channel_id])}")
    
    def remove_user_from_channel(self, user_id: int, channel_id: int):
        """从频道中移除用户"""
        # 移除用户频道映射
        if user_id in self.user_channels:
            self.user_channels[user_id].discard(channel_id)
        
        # 移除频道用户映射
        if channel_id in self.channel_users:
            self.channel_users[channel_id].discard(user_id)
            # 如果频道为空，删除频道映射
            if not self.channel_users[channel_id]:
                del self.channel_users[channel_id]
        
        # 移除频道连接（保留全局连接）
        if user_id in self.active_connections and channel_id in self.active_connections[user_id]:
            del self.active_connections[user_id][channel_id]
        
        logger.info(f"用户 {user_id} 已从频道 {channel_id} 移除")
        logger.info(f"频道 {channel_id} 剩余用户: {list(self.channel_users.get(channel_id, set()))}")


# 全局连接管理器实例
connection_manager = ConnectionManager() 