"""
团队服务
"""
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team
from app.models.team_member import TeamMember, TeamRole
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate


class TeamService:
    """团队服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_team(self, team_create: TeamCreate, owner_id: int) -> Team:
        """创建团队"""
        # 检查slug是否已存在
        existing_team = await self.get_team_by_slug(team_create.slug)
        if existing_team:
            raise ValueError("Team slug already exists")
        
        # 创建团队
        db_team = Team(
            name=team_create.name,
            slug=team_create.slug,
            description=team_create.description,
            is_public=team_create.is_public,
            avatar_url=team_create.avatar_url,
            website=team_create.website,
            owner_id=owner_id,
        )
        
        self.db.add(db_team)
        await self.db.flush()  # 获取team.id
        
        # 自动添加创建者为团队所有者
        team_member = TeamMember(
            team_id=db_team.id,
            user_id=owner_id,
            role=TeamRole.OWNER
        )
        self.db.add(team_member)
        
        await self.db.commit()
        
        # 重新获取团队并预加载members关系以避免序列化错误
        return await self.get_team_by_id(db_team.id)
    
    async def get_team_by_id(self, team_id: int) -> Optional[Team]:
        """根据ID获取团队"""
        query = (
            select(Team)
            .options(selectinload(Team.members).selectinload(TeamMember.user))
            .where(Team.id == team_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_team_by_slug(self, slug: str) -> Optional[Team]:
        """根据slug获取团队"""
        query = select(Team).where(Team.slug == slug)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_teams(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Team]:
        """获取用户所属的团队列表"""
        query = (
            select(Team)
            .join(TeamMember)
            .options(selectinload(Team.members).selectinload(TeamMember.user))
            .where(TeamMember.user_id == user_id)
            .where(Team.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_public_teams(self, skip: int = 0, limit: int = 100) -> List[Team]:
        """获取公开团队列表"""
        query = (
            select(Team)
            .options(selectinload(Team.members).selectinload(TeamMember.user))
            .where(Team.is_public == True)
            .where(Team.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_team(self, team_id: int, team_update: TeamUpdate, user_id: int) -> Optional[Team]:
        """更新团队信息"""
        # 检查权限
        if not await self.check_team_permission(team_id, user_id, [TeamRole.OWNER, TeamRole.ADMIN]):
            raise PermissionError("Insufficient permissions to update team")
        
        team = await self.get_team_by_id(team_id)
        if not team:
            return None
        
        # 更新字段
        update_data = team_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(team, field, value)
        
        await self.db.commit()
        await self.db.refresh(team)
        return team
    
    async def delete_team(self, team_id: int, user_id: int) -> bool:
        """删除团队（软删除）"""
        # 只有团队所有者可以删除团队
        if not await self.check_team_permission(team_id, user_id, [TeamRole.OWNER]):
            raise PermissionError("Only team owner can delete team")
        
        team = await self.get_team_by_id(team_id)
        if not team:
            return False
        
        team.is_active = False
        await self.db.commit()
        return True
    
    async def add_team_member(self, team_id: int, user_id: int, inviter_id: int, role: TeamRole = TeamRole.MEMBER) -> bool:
        """发送团队邀请通知（不直接添加成员）"""
        # 检查邀请者权限
        if not await self.check_team_permission(team_id, inviter_id, [TeamRole.OWNER, TeamRole.ADMIN]):
            raise PermissionError("只有团队所有者和管理员才能邀请新成员")
        
        # 检查用户是否已经是团队成员
        existing_member = await self.get_team_member(team_id, user_id)
        if existing_member:
            raise ValueError(f"用户ID {user_id} 已经是团队成员（角色：{existing_member.role.value}）")
        
        # 检查团队是否存在
        team = await self.get_team_by_id(team_id)
        if not team:
            raise ValueError("团队不存在")
        
        # 检查被邀请的用户是否存在
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        user = user_result.scalar_one_or_none()
        if not user:
            raise ValueError(f"用户ID {user_id} 不存在，请检查用户ID是否正确")
        
        # 获取邀请者信息
        inviter_query = select(User).where(User.id == inviter_id)
        inviter_result = await self.db.execute(inviter_query)
        inviter = inviter_result.scalar_one_or_none()
        if not inviter:
            raise ValueError("邀请者不存在")
        
        # 发送邀请通知
        from app.services.notification_service import NotificationService
        notification_service = NotificationService(self.db)
        
        await notification_service.create_team_invite_notification(
            user_id=user_id,
            team_id=team_id,
            team_name=team.name,
            inviter_id=inviter_id,
            inviter_name=inviter.full_name or inviter.username,
            role=role.value
        )
        
        return True
    
    async def _add_member_directly(self, team_id: int, user_id: int, role: TeamRole = TeamRole.MEMBER) -> Optional[TeamMember]:
        """直接添加团队成员（用于接受邀请）"""
        # 检查用户是否已经是团队成员
        existing_member = await self.get_team_member(team_id, user_id)
        if existing_member:
            return existing_member
        
        # 检查团队是否存在
        team = await self.get_team_by_id(team_id)
        if not team:
            return None
        
        # 添加成员
        team_member = TeamMember(
            team_id=team_id,
            user_id=user_id,
            role=role
        )
        
        self.db.add(team_member)
        await self.db.commit()
        
        # 重新查询以预加载 user 关系，避免序列化时的 MissingGreenlet 错误
        return await self.get_team_member(team_id, user_id)
    
    async def remove_team_member(self, team_id: int, user_id: int, remover_id: int) -> bool:
        """移除团队成员"""
        # 检查权限
        member_to_remove = await self.get_team_member(team_id, user_id)
        if not member_to_remove:
            return False
        
        # 不能移除团队所有者
        if member_to_remove.role == TeamRole.OWNER:
            raise ValueError("Cannot remove team owner")
        
        # 检查移除者权限
        if not await self.check_team_permission(team_id, remover_id, [TeamRole.OWNER, TeamRole.ADMIN]):
            # 用户可以自己退出团队
            if remover_id != user_id:
                raise PermissionError("Insufficient permissions to remove member")
        
        # 获取相关信息用于发送通知
        team = await self.get_team_by_id(team_id)
        if not team:
            return False
        
        removed_user = member_to_remove.user
        is_self_leaving = (remover_id == user_id)
        
        # 获取移除者信息（如果不是自己退出）
        remover_name = None
        if not is_self_leaving:
            remover_query = select(User).where(User.id == remover_id)
            remover_result = await self.db.execute(remover_query)
            remover = remover_result.scalar_one_or_none()
            if remover:
                remover_name = remover.full_name or remover.username
        
        # 执行移除操作
        await self.db.delete(member_to_remove)
        await self.db.commit()
        
        # 发送通知给被移除的用户（如果不是自己退出的话）
        if not is_self_leaving and removed_user:
            from app.services.notification_service import NotificationService
            notification_service = NotificationService(self.db)
            
            await notification_service.create_team_removal_notification(
                user_id=user_id,
                team_name=team.name,
                remover_name=remover_name or "管理员",
                user_role=member_to_remove.role.value
            )
        
        return True
    
    async def update_member_role(self, team_id: int, user_id: int, new_role: TeamRole, updater_id: int) -> Optional[TeamMember]:
        """更新成员角色"""
        # 只有团队所有者可以更改角色
        if not await self.check_team_permission(team_id, updater_id, [TeamRole.OWNER]):
            raise PermissionError("Only team owner can update member roles")
        
        # 不能更改所有者角色
        if new_role == TeamRole.OWNER:
            raise ValueError("Cannot assign owner role to other members")
        
        member = await self.get_team_member(team_id, user_id)
        if not member:
            return None
        
        # 不能更改所有者的角色
        if member.role == TeamRole.OWNER:
            raise ValueError("Cannot change owner role")
        
        member.role = new_role
        await self.db.commit()
        
        # 重新查询以预加载 user 关系，避免序列化时的 MissingGreenlet 错误
        return await self.get_team_member(team_id, user_id)
    
    async def get_team_member(self, team_id: int, user_id: int) -> Optional[TeamMember]:
        """获取团队成员"""
        query = (
            select(TeamMember)
            .options(selectinload(TeamMember.user))
            .where(TeamMember.team_id == team_id)
            .where(TeamMember.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_team_members(self, team_id: int) -> List[TeamMember]:
        """获取团队成员列表"""
        query = (
            select(TeamMember)
            .options(selectinload(TeamMember.user))
            .where(TeamMember.team_id == team_id)
            .order_by(TeamMember.joined_at)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def check_team_permission(self, team_id: int, user_id: int, required_roles: List[TeamRole]) -> bool:
        """检查用户是否有团队权限"""
        member = await self.get_team_member(team_id, user_id)
        if not member:
            return False
        return member.role in required_roles
    
    async def search_teams(self, query: str, limit: int = 10) -> List[Team]:
        """搜索公开团队"""
        search_query = (
            select(Team)
            .where(Team.is_public == True)
            .where(Team.is_active == True)
            .where(
                Team.name.ilike(f"%{query}%") |
                Team.description.ilike(f"%{query}%")
            )
            .limit(limit)
        )
        
        result = await self.db.execute(search_query)
        return result.scalars().all()
    
    async def get_team_stats(self, team_id: int) -> dict:
        """获取团队统计信息"""
        # 成员数量
        member_count_query = select(func.count(TeamMember.id)).where(TeamMember.team_id == team_id)
        member_count_result = await self.db.execute(member_count_query)
        member_count = member_count_result.scalar() or 0
        
        # 频道数量（需要后续实现）
        # channel_count_query = select(func.count(Channel.id)).where(Channel.team_id == team_id)
        # channel_count_result = await self.db.execute(channel_count_query)
        # channel_count = channel_count_result.scalar() or 0
        
        return {
            "member_count": member_count,
            # "channel_count": channel_count,
        } 