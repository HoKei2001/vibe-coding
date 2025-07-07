"""
消息服务
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select, func, desc, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.message import Message
from app.models.channel import Channel
from app.models.user import User
from app.schemas.message import MessageCreate, MessageUpdate
from app.services.channel_service import ChannelService


class MessageService:
    """消息服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_message(self, message_create: MessageCreate, author_id: int) -> Message:
        """发送消息"""
        # 检查用户是否可以访问频道
        channel_service = ChannelService(self.db)
        if not await channel_service.can_user_access_channel(message_create.channel_id, author_id):
            raise PermissionError("Access denied to this channel")
        
        # 检查频道是否存在且活跃
        channel = await channel_service.get_channel_by_id(message_create.channel_id)
        if not channel or not channel.is_active or channel.is_archived:
            raise ValueError("Channel not found or not available")
        
        # 如果是回复消息，检查父消息是否存在
        if message_create.parent_id:
            parent_message = await self.get_message_by_id(message_create.parent_id)
            if not parent_message or parent_message.channel_id != message_create.channel_id:
                raise ValueError("Parent message not found or not in the same channel")
        
        # 创建消息
        db_message = Message(
            content=message_create.content,
            author_id=author_id,
            channel_id=message_create.channel_id,
            parent_id=message_create.parent_id,
            attachment_url=message_create.attachment_url,
            attachment_type=message_create.attachment_type,
            attachment_name=message_create.attachment_name,
            attachment_size=message_create.attachment_size,
        )
        
        self.db.add(db_message)
        await self.db.commit()
        await self.db.refresh(db_message)
        return db_message
    
    async def get_message_by_id(self, message_id: int) -> Optional[Message]:
        """根据ID获取消息"""
        query = (
            select(Message)
            .options(
                selectinload(Message.author),
                selectinload(Message.channel),
                selectinload(Message.replies).selectinload(Message.author)
            )
            .where(Message.id == message_id)
            .where(Message.is_deleted == False)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_channel_messages(
        self, 
        channel_id: int, 
        user_id: int,
        skip: int = 0, 
        limit: int = 50,
        before_message_id: Optional[int] = None,
        after_message_id: Optional[int] = None
    ) -> List[Message]:
        """获取频道消息历史"""
        # 检查用户是否可以访问频道
        channel_service = ChannelService(self.db)
        if not await channel_service.can_user_access_channel(channel_id, user_id):
            raise PermissionError("Access denied to this channel")
        
        query = (
            select(Message)
            .options(
                selectinload(Message.author),
                selectinload(Message.replies).selectinload(Message.author)
            )
            .where(Message.channel_id == channel_id)
            .where(Message.is_deleted == False)
            .where(Message.parent_id.is_(None))  # 只获取主消息，不包含回复
            .order_by(desc(Message.created_at))
        )
        
        # 分页：基于消息ID或偏移量
        if before_message_id:
            before_message = await self.get_message_by_id(before_message_id)
            if before_message:
                query = query.where(Message.created_at < before_message.created_at)
        elif after_message_id:
            after_message = await self.get_message_by_id(after_message_id)
            if after_message:
                query = query.where(Message.created_at > after_message.created_at)
                query = query.order_by(Message.created_at)  # 升序获取之后的消息
        else:
            query = query.offset(skip)
        
        query = query.limit(limit)
        
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        # 如果是获取之后的消息，需要重新按时间倒序排列
        if after_message_id:
            messages = list(reversed(messages))
        
        return messages
    
    async def get_message_replies(self, parent_message_id: int, user_id: int) -> List[Message]:
        """获取消息的回复"""
        # 首先检查父消息是否存在以及用户权限
        parent_message = await self.get_message_by_id(parent_message_id)
        if not parent_message:
            raise ValueError("Parent message not found")
        
        channel_service = ChannelService(self.db)
        if not await channel_service.can_user_access_channel(parent_message.channel_id, user_id):
            raise PermissionError("Access denied to this channel")
        
        query = (
            select(Message)
            .options(selectinload(Message.author))
            .where(Message.parent_id == parent_message_id)
            .where(Message.is_deleted == False)
            .order_by(Message.created_at)
        )
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_message(self, message_id: int, message_update: MessageUpdate, user_id: int) -> Optional[Message]:
        """编辑消息"""
        message = await self.get_message_by_id(message_id)
        if not message:
            return None
        
        # 只有消息作者可以编辑消息
        if message.author_id != user_id:
            raise PermissionError("Only message author can edit the message")
        
        # 检查消息是否可以编辑（通常有时间限制，这里简化处理）
        if message.is_deleted:
            raise ValueError("Cannot edit deleted message")
        
        # 更新消息内容
        message.content = message_update.content
        message.is_edited = True
        
        await self.db.commit()
        await self.db.refresh(message)
        return message
    
    async def delete_message(self, message_id: int, user_id: int) -> bool:
        """删除消息（软删除）"""
        message = await self.get_message_by_id(message_id)
        if not message:
            return False
        
        # 检查权限：消息作者或频道管理员可以删除消息
        can_delete = False
        
        if message.author_id == user_id:
            can_delete = True
        else:
            # 检查是否是频道管理员
            channel_service = ChannelService(self.db)
            from app.models.channel_member import ChannelRole
            can_delete = await channel_service.check_channel_permission(
                message.channel_id, user_id, [ChannelRole.ADMIN]
            )
        
        if not can_delete:
            raise PermissionError("Insufficient permissions to delete message")
        
        message.is_deleted = True
        await self.db.commit()
        return True
    
    async def search_messages(
        self, 
        query: str, 
        user_id: int,
        channel_id: Optional[int] = None,
        team_id: Optional[int] = None,
        limit: int = 20
    ) -> List[Message]:
        """搜索消息"""
        search_query = (
            select(Message)
            .options(
                selectinload(Message.author),
                selectinload(Message.channel)
            )
            .where(Message.is_deleted == False)
            .where(Message.content.ilike(f"%{query}%"))
        )
        
        # 根据频道或团队过滤
        if channel_id:
            # 检查用户是否可以访问频道
            channel_service = ChannelService(self.db)
            if not await channel_service.can_user_access_channel(channel_id, user_id):
                return []
            search_query = search_query.where(Message.channel_id == channel_id)
        elif team_id:
            # 获取用户可以访问的团队频道
            channel_service = ChannelService(self.db)
            accessible_channels = await channel_service.get_team_channels(team_id, user_id)
            if not accessible_channels:
                return []
            channel_ids = [channel.id for channel in accessible_channels]
            search_query = search_query.where(Message.channel_id.in_(channel_ids))
        else:
            # 全局搜索：只搜索用户可以访问的频道
            channel_service = ChannelService(self.db)
            user_channels = await channel_service.get_user_channels(user_id)
            if not user_channels:
                return []
            channel_ids = [channel.id for channel in user_channels]
            search_query = search_query.where(Message.channel_id.in_(channel_ids))
        
        search_query = search_query.order_by(desc(Message.created_at)).limit(limit)
        
        result = await self.db.execute(search_query)
        return result.scalars().all()
    
    async def get_user_mentions(self, user_id: int, skip: int = 0, limit: int = 50) -> List[Message]:
        """获取用户被提及的消息"""
        # 这里简化实现，实际应该解析消息内容中的@用户名
        # 现在只是获取用户的频道中的最新消息作为示例
        channel_service = ChannelService(self.db)
        user_channels = await channel_service.get_user_channels(user_id)
        
        if not user_channels:
            return []
        
        channel_ids = [channel.id for channel in user_channels]
        
        query = (
            select(Message)
            .options(
                selectinload(Message.author),
                selectinload(Message.channel)
            )
            .where(Message.channel_id.in_(channel_ids))
            .where(Message.is_deleted == False)
            .where(Message.author_id != user_id)  # 不包括自己的消息
            .where(Message.content.ilike(f"%@{user_id}%"))  # 简化的提及检查
            .order_by(desc(Message.created_at))
            .offset(skip)
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_message_stats(self, channel_id: int) -> dict:
        """获取频道消息统计"""
        # 总消息数
        total_query = select(func.count(Message.id)).where(
            and_(Message.channel_id == channel_id, Message.is_deleted == False)
        )
        total_result = await self.db.execute(total_query)
        total_messages = total_result.scalar() or 0
        
        # 今日消息数
        today = datetime.utcnow().date()
        today_query = select(func.count(Message.id)).where(
            and_(
                Message.channel_id == channel_id,
                Message.is_deleted == False,
                func.date(Message.created_at) == today
            )
        )
        today_result = await self.db.execute(today_query)
        today_messages = today_result.scalar() or 0
        
        # 有附件的消息数
        attachments_query = select(func.count(Message.id)).where(
            and_(
                Message.channel_id == channel_id,
                Message.is_deleted == False,
                Message.attachment_url.isnot(None)
            )
        )
        attachments_result = await self.db.execute(attachments_query)
        attachment_messages = attachments_result.scalar() or 0
        
        return {
            "total_messages": total_messages,
            "today_messages": today_messages,
            "attachment_messages": attachment_messages,
        }
    
    async def get_recent_messages(self, user_id: int, limit: int = 10) -> List[Message]:
        """获取用户最近的消息"""
        channel_service = ChannelService(self.db)
        user_channels = await channel_service.get_user_channels(user_id)
        
        if not user_channels:
            return []
        
        channel_ids = [channel.id for channel in user_channels]
        
        query = (
            select(Message)
            .options(
                selectinload(Message.author),
                selectinload(Message.channel)
            )
            .where(Message.channel_id.in_(channel_ids))
            .where(Message.is_deleted == False)
            .order_by(desc(Message.created_at))
            .limit(limit)
        )
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def mark_messages_as_read(self, channel_id: int, user_id: int, last_read_message_id: int) -> bool:
        """标记消息为已读（这里简化实现，实际需要单独的已读状态表）"""
        # 检查用户是否可以访问频道
        channel_service = ChannelService(self.db)
        if not await channel_service.can_user_access_channel(channel_id, user_id):
            raise PermissionError("Access denied to this channel")
        
        # 这里应该更新用户的已读状态，简化实现只返回True
        # 实际实现需要一个单独的表来跟踪每个用户在每个频道的最后已读消息ID
        return True 