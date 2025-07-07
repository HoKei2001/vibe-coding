"""
消息API路由
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.message import (
    MessageCreate, MessageUpdate, MessageResponse, MessageSummary,
    MessageSearchParams, MessageStats, MessageMentions
)
from app.services.message_service import MessageService
from app.services.websocket_manager import connection_manager

router = APIRouter()


@router.get("", response_model=List[MessageResponse])
async def get_messages(
    channel_id: Optional[int] = Query(None, description="Filter by channel ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    before_message_id: Optional[int] = Query(None, description="Get messages before this ID"),
    after_message_id: Optional[int] = Query(None, description="Get messages after this ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取消息列表"""
    message_service = MessageService(db)
    
    if channel_id:
        try:
            messages = await message_service.get_channel_messages(
                channel_id, current_user.id, skip, limit, before_message_id, after_message_id
            )
            return messages
        except PermissionError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e)
            )
    else:
        # 获取用户最近的消息
        messages = await message_service.get_recent_messages(current_user.id, limit)
        return messages


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_create: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """发送消息"""
    message_service = MessageService(db)
    
    try:
        message = await message_service.create_message(message_create, current_user.id)
        
        # 通过WebSocket广播新消息给频道内的其他用户
        await connection_manager.broadcast_to_channel(
            message_create.channel_id,
            {
                "type": "message",
                "data": {
                    "id": message.id,
                    "content": message.content,
                    "is_edited": message.is_edited,
                    "is_deleted": message.is_deleted,
                    "author_id": message.author_id,
                    "channel_id": message.channel_id,
                    "parent_id": message.parent_id,
                    "attachment_url": message.attachment_url,
                    "attachment_type": message.attachment_type,
                    "attachment_name": message.attachment_name,
                    "attachment_size": message.attachment_size,
                    "created_at": message.created_at.isoformat(),
                    "updated_at": message.updated_at.isoformat(),
                    "author": {
                        "id": message.author.id,
                        "username": message.author.username,
                        "full_name": message.author.full_name,
                        "email": message.author.email,
                        "bio": message.author.bio,
                        "avatar_url": message.author.avatar_url,
                        "timezone": message.author.timezone,
                        "is_online": message.author.is_online,
                        "last_seen": message.author.last_seen.isoformat() if message.author.last_seen else None
                    },
                    "replies": []
                },
                "channel_id": message_create.channel_id,
                "timestamp": message.created_at.isoformat()
            }
        )
        
        return message
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取消息详情"""
    message_service = MessageService(db)
    
    message = await message_service.get_message_by_id(message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # 检查用户是否可以访问该消息所在的频道
    from app.services.channel_service import ChannelService
    channel_service = ChannelService(db)
    if not await channel_service.can_user_access_channel(message.channel_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return message


@router.put("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: int,
    message_update: MessageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """编辑消息"""
    message_service = MessageService(db)
    
    try:
        message = await message_service.update_message(message_id, message_update, current_user.id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        return message
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除消息"""
    message_service = MessageService(db)
    
    try:
        success = await message_service.delete_message(message_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        return {"message": "Message deleted successfully"}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{message_id}/replies", response_model=List[MessageResponse])
async def get_message_replies(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取消息的回复"""
    message_service = MessageService(db)
    
    try:
        replies = await message_service.get_message_replies(message_id, current_user.id)
        return replies
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/search", response_model=List[MessageResponse])
async def search_messages(
    q: str = Query(..., min_length=1, description="Search query"),
    channel_id: Optional[int] = Query(None, description="Search in specific channel"),
    team_id: Optional[int] = Query(None, description="Search in team channels"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """搜索消息"""
    message_service = MessageService(db)
    
    messages = await message_service.search_messages(
        q, current_user.id, channel_id, team_id, limit
    )
    return messages


@router.get("/mentions/me", response_model=List[MessageResponse])
async def get_user_mentions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取用户被提及的消息"""
    message_service = MessageService(db)
    
    mentions = await message_service.get_user_mentions(current_user.id, skip, limit)
    return mentions


@router.get("/channel/{channel_id}/stats", response_model=MessageStats)
async def get_channel_message_stats(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道消息统计"""
    # 检查用户是否可以访问频道
    from app.services.channel_service import ChannelService
    channel_service = ChannelService(db)
    if not await channel_service.can_user_access_channel(channel_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    message_service = MessageService(db)
    stats = await message_service.get_message_stats(channel_id)
    return MessageStats(**stats)


@router.post("/channel/{channel_id}/mark-read")
async def mark_messages_as_read(
    channel_id: int,
    last_read_message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """标记消息为已读"""
    message_service = MessageService(db)
    
    try:
        success = await message_service.mark_messages_as_read(
            channel_id, current_user.id, last_read_message_id
        )
        if success:
            return {"message": "Messages marked as read"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to mark messages as read"
            )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/recent", response_model=List[MessageResponse])
async def get_recent_messages(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取用户最近的消息"""
    message_service = MessageService(db)
    
    messages = await message_service.get_recent_messages(current_user.id, limit)
    return messages 