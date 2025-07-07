"""
通知服务
"""
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationCreate, NotificationUpdate


class NotificationService:
    """通知服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """创建通知"""
        notification = Notification(
            user_id=notification_data.user_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            data=notification_data.data
        )
        
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification
    
    async def get_user_notifications(self, user_id: int, skip: int = 0, limit: int = 50, unread_only: bool = False) -> List[Notification]:
        """获取用户通知列表"""
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        
        if unread_only:
            query = query.where(Notification.is_read == False)
            
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_notification_by_id(self, notification_id: int) -> Optional[Notification]:
        """根据ID获取通知"""
        query = select(Notification).where(Notification.id == notification_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def mark_notification_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        """标记通知为已读"""
        notification = await self.get_notification_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            return None
        
        notification.is_read = True
        await self.db.commit()
        return notification
    
    async def mark_all_notifications_as_read(self, user_id: int) -> int:
        """标记用户所有通知为已读"""
        from sqlalchemy import update
        
        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount
    
    async def get_unread_count(self, user_id: int) -> int:
        """获取用户未读通知数量"""
        query = (
            select(func.count(Notification.id))
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        result = await self.db.execute(query)
        return result.scalar() or 0
    
    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """删除通知"""
        notification = await self.get_notification_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            return False
        
        await self.db.delete(notification)
        await self.db.commit()
        return True
    
    async def create_team_invite_notification(self, user_id: int, team_id: int, team_name: str, inviter_id: int, inviter_name: str, role: str) -> Notification:
        """创建团队邀请通知"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.TEAM_INVITE,
            title="团队邀请",
            message=f"{inviter_name} 邀请您加入团队 {team_name}",
            data={
                "team_id": team_id,
                "team_name": team_name,
                "inviter_id": inviter_id,
                "inviter_name": inviter_name,
                "role": role
            }
        )
        return await self.create_notification(notification_data)
    
    async def handle_team_invite_response(self, notification_id: int, user_id: int, accepted: bool) -> bool:
        """处理团队邀请响应"""
        notification = await self.get_notification_by_id(notification_id)
        if not notification or notification.user_id != user_id or notification.type != NotificationType.TEAM_INVITE:
            return False
        
        # 获取被邀请者和邀请者信息
        from app.models.user import User
        from sqlalchemy import select
        
        user_query = select(User).where(User.id == user_id)
        user_result = await self.db.execute(user_query)
        invited_user = user_result.scalar_one_or_none()
        
        inviter_id = notification.data.get("inviter_id") if notification.data else None
        team_name = notification.data.get("team_name") if notification.data else "未知团队"
        
        if not invited_user or not inviter_id:
            return False
        
        invited_user_name = invited_user.full_name or invited_user.username
        
        if accepted and notification.data:
            # 如果接受邀请，添加用户到团队
            from app.services.team_service import TeamService
            from app.models.team_member import TeamRole
            
            team_service = TeamService(self.db)
            team_id = notification.data.get("team_id")
            role_str = notification.data.get("role", "member")
            
            # 转换角色字符串为枚举
            role_map = {
                "admin": TeamRole.ADMIN,
                "member": TeamRole.MEMBER,
                "guest": TeamRole.GUEST
            }
            role = role_map.get(role_str, TeamRole.MEMBER)
            
            try:
                # 直接添加成员，不进行权限检查（因为这是接受邀请）
                team_member = await team_service._add_member_directly(team_id, user_id, role)
                if team_member:
                    # 标记通知为已读，保留通知记录用于历史查看
                    await self.mark_notification_as_read(notification_id, user_id)
                    # 更新通知消息，表明已接受邀请
                    notification.message = f"{notification.data.get('inviter_name')} 邀请您加入团队 {notification.data.get('team_name')} - 已接受"
                    await self.db.commit()
                    
                    # 给邀请人发送接受邀请的通知
                    await self.create_invitation_response_notification(
                        inviter_id, invited_user_name, team_name, True
                    )
                    
                    return True
            except Exception as e:
                print(f"添加团队成员失败: {e}")
                return False
        else:
            # 如果拒绝邀请，标记通知为已读并更新消息
            await self.mark_notification_as_read(notification_id, user_id)
            notification.message = f"{notification.data.get('inviter_name')} 邀请您加入团队 {notification.data.get('team_name')} - 已拒绝"
            await self.db.commit()
            
            # 给邀请人发送拒绝邀请的通知
            await self.create_invitation_response_notification(
                inviter_id, invited_user_name, team_name, False
            )
            
            return True
        
        return False
    
    async def create_invitation_response_notification(self, inviter_id: int, invited_user_name: str, team_name: str, accepted: bool) -> Notification:
        """创建邀请响应通知"""
        action = "接受" if accepted else "拒绝"
        icon = "✅" if accepted else "❌"
        
        notification_data = NotificationCreate(
            user_id=inviter_id,
            type=NotificationType.SYSTEM,
            title="邀请响应",
            message=f"{icon} {invited_user_name} {action}了您的团队邀请（{team_name}）",
            data={
                "invited_user_name": invited_user_name,
                "team_name": team_name,
                "accepted": accepted,
                "response_type": "team_invite_response"
            }
        )
        return await self.create_notification(notification_data) 
    
    async def create_team_removal_notification(self, user_id: int, team_name: str, remover_name: str, user_role: str) -> Notification:
        """创建团队移除通知"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.SYSTEM,
            title="团队移除通知",
            message=f"❌ 您已被 {remover_name} 从团队 {team_name} 中移除",
            data={
                "team_name": team_name,
                "remover_name": remover_name,
                "user_role": user_role,
                "action_type": "team_removal"
            }
        )
        return await self.create_notification(notification_data) 