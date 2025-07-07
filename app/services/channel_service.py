"""
频道服务
"""
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.channel import Channel, ChannelType
from app.models.channel_member import ChannelMember, ChannelRole
from app.models.team_member import TeamMember, TeamRole
from app.models.user import User
from app.schemas.channel import ChannelCreate, ChannelUpdate
from app.services.team_service import TeamService


class ChannelService:
    """频道服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_channel(self, channel_create: ChannelCreate, creator_id: int) -> Channel:
        """创建频道"""
        # 检查用户是否有团队权限
        team_service = TeamService(self.db)
        has_permission = await team_service.check_team_permission(
            channel_create.team_id, creator_id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER]
        )
        if not has_permission:
            raise PermissionError("Insufficient permissions to create channel")
        
        # 检查频道名称是否在团队中唯一
        existing_channel = await self.get_channel_by_name_and_team(
            channel_create.name, channel_create.team_id
        )
        if existing_channel:
            raise ValueError("Channel name already exists in this team")
        
        # 创建频道
        db_channel = Channel(
            name=channel_create.name,
            description=channel_create.description,
            type=channel_create.type,
            topic=channel_create.topic,
            team_id=channel_create.team_id,
            created_by=creator_id,
        )
        
        self.db.add(db_channel)
        await self.db.flush()  # 获取channel.id
        
        # 自动添加创建者为频道管理员
        channel_member = ChannelMember(
            channel_id=db_channel.id,
            user_id=creator_id,
            role=ChannelRole.ADMIN
        )
        self.db.add(channel_member)
        
        # 如果是公开频道，自动添加所有团队成员
        if channel_create.type == ChannelType.PUBLIC:
            team_members = await team_service.get_team_members(channel_create.team_id)
            for team_member in team_members:
                if team_member.user_id != creator_id:  # 创建者已经添加
                    member = ChannelMember(
                        channel_id=db_channel.id,
                        user_id=team_member.user_id,
                        role=ChannelRole.MEMBER
                    )
                    self.db.add(member)
        
        await self.db.commit()
        
        # 重新获取频道并预加载所有关系以避免序列化错误
        return await self.get_channel_by_id(db_channel.id)
    
    async def get_channel_by_id(self, channel_id: int) -> Optional[Channel]:
        """根据ID获取频道"""
        query = (
            select(Channel)
            .options(
                selectinload(Channel.members).selectinload(ChannelMember.user)
            )
            .where(Channel.id == channel_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_channel_by_name_and_team(self, name: str, team_id: int) -> Optional[Channel]:
        """根据名称和团队获取频道"""
        query = (
            select(Channel)
            .where(Channel.name == name)
            .where(Channel.team_id == team_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_team_channels(self, team_id: int, user_id: int, include_archived: bool = False) -> List[Channel]:
        """获取团队频道列表（用户有权限访问的）"""
        # 首先检查用户是否是团队成员
        team_service = TeamService(self.db)
        is_team_member = await team_service.check_team_permission(
            team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
        )
        if not is_team_member:
            return []
        
        query = (
            select(Channel)
            .options(selectinload(Channel.members).selectinload(ChannelMember.user))
            .where(Channel.team_id == team_id)
            .where(Channel.is_active == True)
        )
        
        if not include_archived:
            query = query.where(Channel.is_archived == False)
        
        result = await self.db.execute(query)
        all_channels = result.scalars().all()
        
        # 过滤用户有权限访问的频道
        accessible_channels = []
        for channel in all_channels:
            if await self.can_user_access_channel(channel.id, user_id):
                accessible_channels.append(channel)
        
        return accessible_channels
    
    async def get_user_channels(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Channel]:
        """获取用户参与的频道列表"""
        query = (
            select(Channel)
            .join(ChannelMember)
            .options(selectinload(Channel.members).selectinload(ChannelMember.user))
            .where(ChannelMember.user_id == user_id)
            .where(Channel.is_active == True)
            .where(Channel.is_archived == False)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_channel(self, channel_id: int, channel_update: ChannelUpdate, user_id: int) -> Optional[Channel]:
        """更新频道信息"""
        # 检查权限
        if not await self.check_channel_permission(channel_id, user_id, [ChannelRole.ADMIN]):
            raise PermissionError("Insufficient permissions to update channel")
        
        channel = await self.get_channel_by_id(channel_id)
        if not channel:
            return None
        
        # 更新字段
        update_data = channel_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(channel, field, value)
        
        await self.db.commit()
        await self.db.refresh(channel)
        return channel
    
    async def archive_channel(self, channel_id: int, user_id: int) -> bool:
        """归档频道"""
        # 检查权限（频道管理员或团队管理员可以归档）
        if not await self.check_channel_permission(channel_id, user_id, [ChannelRole.ADMIN]):
            # 检查是否是团队管理员
            channel = await self.get_channel_by_id(channel_id)
            if not channel:
                return False
            
            team_service = TeamService(self.db)
            if not await team_service.check_team_permission(
                channel.team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN]
            ):
                raise PermissionError("Insufficient permissions to archive channel")
        
        channel = await self.get_channel_by_id(channel_id)
        if not channel:
            return False
        
        channel.is_archived = True
        await self.db.commit()
        return True
    
    async def delete_channel(self, channel_id: int, user_id: int) -> bool:
        """删除频道（软删除）"""
        # 只有团队所有者可以删除频道
        channel = await self.get_channel_by_id(channel_id)
        if not channel:
            return False
        
        team_service = TeamService(self.db)
        if not await team_service.check_team_permission(
            channel.team_id, user_id, [TeamRole.OWNER]
        ):
            raise PermissionError("Only team owner can delete channels")
        
        channel.is_active = False
        await self.db.commit()
        return True
    
    async def add_channel_member(self, channel_id: int, user_id: int, inviter_id: int, role: ChannelRole = ChannelRole.MEMBER) -> ChannelMember:
        """添加频道成员"""
        # 检查邀请者权限
        if not await self.check_channel_permission(channel_id, inviter_id, [ChannelRole.ADMIN]):
            raise PermissionError("Insufficient permissions to invite members")
        
        # 检查用户是否已经是频道成员
        existing_member = await self.get_channel_member(channel_id, user_id)
        if existing_member:
            raise ValueError("User is already a channel member")
        
        # 检查频道是否存在
        channel = await self.get_channel_by_id(channel_id)
        if not channel:
            raise ValueError("Channel not found")
        
        # 检查用户是否是团队成员
        team_service = TeamService(self.db)
        if not await team_service.check_team_permission(
            channel.team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
        ):
            raise ValueError("User must be a team member first")
        
        # 添加成员
        channel_member = ChannelMember(
            channel_id=channel_id,
            user_id=user_id,
            role=role
        )
        
        self.db.add(channel_member)
        await self.db.commit()
        await self.db.refresh(channel_member)
        return channel_member
    
    async def remove_channel_member(self, channel_id: int, user_id: int, remover_id: int) -> bool:
        """移除频道成员"""
        member_to_remove = await self.get_channel_member(channel_id, user_id)
        if not member_to_remove:
            return False
        
        # 检查权限
        if not await self.check_channel_permission(channel_id, remover_id, [ChannelRole.ADMIN]):
            # 用户可以自己退出频道
            if remover_id != user_id:
                raise PermissionError("Insufficient permissions to remove member")
        
        await self.db.delete(member_to_remove)
        await self.db.commit()
        return True
    
    async def update_member_role(self, channel_id: int, user_id: int, new_role: ChannelRole, updater_id: int) -> Optional[ChannelMember]:
        """更新成员角色"""
        # 只有频道管理员可以更改角色
        if not await self.check_channel_permission(channel_id, updater_id, [ChannelRole.ADMIN]):
            raise PermissionError("Only channel admins can update member roles")
        
        member = await self.get_channel_member(channel_id, user_id)
        if not member:
            return None
        
        member.role = new_role
        await self.db.commit()
        await self.db.refresh(member)
        return member
    
    async def get_channel_member(self, channel_id: int, user_id: int) -> Optional[ChannelMember]:
        """获取频道成员"""
        query = (
            select(ChannelMember)
            .options(selectinload(ChannelMember.user))
            .where(ChannelMember.channel_id == channel_id)
            .where(ChannelMember.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_channel_members(self, channel_id: int) -> List[ChannelMember]:
        """获取频道成员列表"""
        query = (
            select(ChannelMember)
            .options(selectinload(ChannelMember.user))
            .where(ChannelMember.channel_id == channel_id)
            .order_by(ChannelMember.joined_at)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def check_channel_permission(self, channel_id: int, user_id: int, required_roles: List[ChannelRole]) -> bool:
        """检查用户是否有频道权限"""
        member = await self.get_channel_member(channel_id, user_id)
        if not member:
            return False
        return member.role in required_roles
    
    async def can_user_access_channel(self, channel_id: int, user_id: int) -> bool:
        """检查用户是否可以访问频道"""
        channel = await self.get_channel_by_id(channel_id)
        if not channel:
            return False
        
        # 公开频道：团队成员都可以访问
        if channel.type == ChannelType.PUBLIC:
            team_service = TeamService(self.db)
            return await team_service.check_team_permission(
                channel.team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
            )
        
        # 私有频道：需要是频道成员
        if channel.type == ChannelType.PRIVATE:
            return await self.check_channel_permission(
                channel_id, user_id, [ChannelRole.ADMIN, ChannelRole.MEMBER]
            )
        
        # 直接消息频道：只有参与者可以访问
        if channel.type == ChannelType.DIRECT:
            return await self.check_channel_permission(
                channel_id, user_id, [ChannelRole.ADMIN, ChannelRole.MEMBER]
            )
        
        return False
    
    async def search_channels(self, team_id: int, user_id: int, query: str, limit: int = 10) -> List[Channel]:
        """搜索团队中的频道"""
        # 检查用户是否是团队成员
        team_service = TeamService(self.db)
        if not await team_service.check_team_permission(
            team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
        ):
            return []
        
        search_query = (
            select(Channel)
            .where(Channel.team_id == team_id)
            .where(Channel.is_active == True)
            .where(Channel.is_archived == False)
            .where(
                Channel.name.ilike(f"%{query}%") |
                Channel.description.ilike(f"%{query}%") |
                Channel.topic.ilike(f"%{query}%")
            )
            .limit(limit)
        )
        
        result = await self.db.execute(search_query)
        all_channels = result.scalars().all()
        
        # 过滤用户有权限访问的频道
        accessible_channels = []
        for channel in all_channels:
            if await self.can_user_access_channel(channel.id, user_id):
                accessible_channels.append(channel)
        
        return accessible_channels
    
    async def get_channel_stats(self, channel_id: int) -> dict:
        """获取频道统计信息"""
        # 成员数量
        member_count_query = select(func.count(ChannelMember.id)).where(ChannelMember.channel_id == channel_id)
        member_count_result = await self.db.execute(member_count_query)
        member_count = member_count_result.scalar() or 0
        
        # 消息数量（需要后续实现）
        # message_count_query = select(func.count(Message.id)).where(Message.channel_id == channel_id)
        # message_count_result = await self.db.execute(message_count_query)
        # message_count = message_count_result.scalar() or 0
        
        return {
            "member_count": member_count,
            # "message_count": message_count,
        } 