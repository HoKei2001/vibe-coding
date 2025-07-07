"""
WebSocket 路由
处理实时通信连接和消息
"""
import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import verify_websocket_token
from app.database.database import get_db
from app.services.websocket_manager import connection_manager
from app.models import User, Channel, Message, ChannelMember
from app.services.message_service import MessageService
from app.services.channel_service import ChannelService
from app.schemas.message import MessageCreate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """WebSocket 连接端点"""
    try:
        # 验证 token 并获取用户信息
        current_user = await verify_websocket_token(token, db)
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        user_id = current_user.id
        
        # 接受WebSocket连接
        await websocket.accept()
        
        # 建立全局连接（用户不绑定到特定频道）
        await connection_manager.connect(websocket, user_id, channel_id=None)
        
        # 缓存用户信息
        connection_manager.set_user_info(user_id, {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email
        })
        
        logger.info(f"WebSocket 连接已建立: 用户 {user_id}")
        
        try:
            while True:
                # 接收客户端消息
                data = await websocket.receive_text()
                message = json.loads(data)
                
                await handle_websocket_message(message, user_id, db)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket 连接断开: 用户 {user_id}")
        except Exception as e:
            logger.error(f"WebSocket 处理消息时出错: {e}")
        finally:
            # 清理连接
            await connection_manager.disconnect(user_id)
            
    except Exception as e:
        logger.error(f"WebSocket 连接失败: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)


async def handle_websocket_message(message: dict, user_id: int, db: AsyncSession):
    """处理 WebSocket 消息"""
    message_type = message.get("type")
    data = message.get("data", {})
    channel_id = message.get("channel_id")
    timestamp = message.get("timestamp")
    
    try:
        if message_type == "join_channel":
            await handle_join_channel(user_id, channel_id, timestamp, db)
            
        elif message_type == "leave_channel":
            await handle_leave_channel(user_id, channel_id, timestamp, db)
            
        elif message_type == "send_message":
            await handle_send_message(user_id, channel_id, data, db)
            
        elif message_type == "user_typing":
            await handle_user_typing(user_id, channel_id, data)
            
        elif message_type == "user_online":
            await handle_user_online(user_id, channel_id, data)
            
        elif message_type == "user_offline":
            await handle_user_offline(user_id, channel_id, data)
            
        else:
            logger.warning(f"未知的消息类型: {message_type}")
            
    except Exception as e:
        logger.error(f"处理 WebSocket 消息失败: {e}")


async def handle_join_channel(user_id: int, channel_id: int, timestamp: str, db: AsyncSession):
    """处理加入频道"""
    if not channel_id:
        return
    
    try:
        channel_service = ChannelService(db)
        
        channel = await channel_service.get_channel_by_id(channel_id)
        if not channel:
            logger.warning(f"频道 {channel_id} 不存在")
            return
        
        # 检查用户是否是频道成员
        is_member = await channel_service.can_user_access_channel(channel_id, user_id)
        if not is_member:
            logger.warning(f"用户 {user_id} 不是频道 {channel_id} 的成员")
            return
        
        # 将用户添加到频道的活跃用户列表
        connection_manager.add_user_to_channel(user_id, channel_id)
        
        logger.info(f"用户 {user_id} 成功加入频道 {channel_id}")
        
        # 通知频道内其他用户
        user_info = connection_manager.get_user_info(user_id)
        await connection_manager.broadcast_to_channel(
            channel_id,
            {
                "type": "user_online",
                "data": {
                    "user_id": user_id,
                    "username": user_info.get("username") if user_info else "",
                    "channel_id": channel_id,
                    "action": "join_channel"
                },
                "timestamp": timestamp or ""
            },
            exclude_user=user_id
        )
        
    except Exception as e:
        logger.error(f"处理加入频道失败: {e}")


async def handle_leave_channel(user_id: int, channel_id: int, timestamp: str, db: AsyncSession):
    """处理离开频道"""
    if not channel_id:
        return
    
    try:
        # 从频道的活跃用户列表中移除用户
        connection_manager.remove_user_from_channel(user_id, channel_id)
        
        logger.info(f"用户 {user_id} 离开频道 {channel_id}")
        
        # 通知频道内其他用户
        user_info = connection_manager.get_user_info(user_id)
        await connection_manager.broadcast_to_channel(
            channel_id,
            {
                "type": "user_offline",
                "data": {
                    "user_id": user_id,
                    "username": user_info.get("username") if user_info else "",
                    "channel_id": channel_id,
                    "action": "leave_channel"
                },
                "timestamp": timestamp or ""
            },
            exclude_user=user_id
        )
        
    except Exception as e:
        logger.error(f"处理离开频道失败: {e}")


async def handle_send_message(user_id: int, channel_id: int, data: dict, db: AsyncSession):
    """处理发送消息"""
    if not channel_id or not data.get("content"):
        return
    
    try:
        message_service = MessageService(db)
        
        # 创建消息
        message_data = MessageCreate(
            content=data["content"],
            channel_id=channel_id,
            parent_id=data.get("parent_id")
        )
        
        # 保存消息到数据库
        new_message = await message_service.create_message(message_data, user_id)
        
        # 广播消息到频道内所有用户
        await connection_manager.broadcast_to_channel(
            channel_id,
            {
                "type": "message",
                "data": {
                    "id": new_message.id,
                    "content": new_message.content,
                    "author_id": new_message.author_id,
                    "author": {
                        "id": new_message.author.id,
                        "username": new_message.author.username,
                        "full_name": new_message.author.full_name,
                        "email": new_message.author.email
                    },
                    "channel_id": new_message.channel_id,
                    "parent_id": new_message.parent_id,
                    "created_at": new_message.created_at.isoformat(),
                    "updated_at": new_message.updated_at.isoformat(),
                    "is_edited": new_message.is_edited
                },
                "channel_id": channel_id,
                "timestamp": new_message.created_at.isoformat()
            }
        )
        
        logger.info(f"消息已发送: 用户 {user_id} 在频道 {channel_id}")
        
    except Exception as e:
        logger.error(f"处理发送消息失败: {e}")


async def handle_user_typing(user_id: int, channel_id: int, data: dict):
    """处理用户正在输入状态"""
    if not channel_id:
        return
    
    try:
        is_typing = data.get("is_typing", False)
        user_info = connection_manager.get_user_info(user_id)
        
        # 广播输入状态到频道内其他用户
        await connection_manager.broadcast_to_channel(
            channel_id,
            {
                "type": "user_typing",
                "data": {
                    "user_id": user_id,
                    "username": user_info.get("username") if user_info else "",
                    "channel_id": channel_id,
                    "is_typing": is_typing
                },
                "timestamp": data.get("timestamp")
            },
            exclude_user=user_id
        )
        
    except Exception as e:
        logger.error(f"处理用户输入状态失败: {e}")


async def handle_user_online(user_id: int, channel_id: Optional[int], data: dict):
    """处理用户上线"""
    try:
        user_info = connection_manager.get_user_info(user_id)
        action = data.get("action", "online")
        
        if action == "join_channel" and channel_id:
            # 加入频道
            await connection_manager.broadcast_to_channel(
                channel_id,
                {
                    "type": "user_online",
                    "data": {
                        "user_id": user_id,
                        "username": user_info.get("username") if user_info else "",
                        "channel_id": channel_id,
                        "action": action
                    },
                    "timestamp": data.get("timestamp")
                },
                exclude_user=user_id
            )
        
    except Exception as e:
        logger.error(f"处理用户上线失败: {e}")


async def handle_user_offline(user_id: int, channel_id: Optional[int], data: dict):
    """处理用户下线"""
    try:
        user_info = connection_manager.get_user_info(user_id)
        action = data.get("action", "offline")
        
        if action == "leave_channel" and channel_id:
            # 离开频道
            await connection_manager.broadcast_to_channel(
                channel_id,
                {
                    "type": "user_offline",
                    "data": {
                        "user_id": user_id,
                        "username": user_info.get("username") if user_info else "",
                        "channel_id": channel_id,
                        "action": action
                    },
                    "timestamp": data.get("timestamp")
                },
                exclude_user=user_id
            )
        
    except Exception as e:
        logger.error(f"处理用户下线失败: {e}") 