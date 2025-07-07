"""
通知相关的Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationCreate(BaseModel):
    """创建通知schema"""
    user_id: int
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationUpdate(BaseModel):
    """更新通知schema"""
    is_read: Optional[bool] = None


class NotificationResponse(BaseModel):
    """通知响应schema"""
    id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TeamInviteData(BaseModel):
    """团队邀请通知数据"""
    team_id: int
    team_name: str
    inviter_id: int
    inviter_name: str
    role: str 