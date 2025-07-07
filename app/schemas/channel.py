"""
频道相关的Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.channel import ChannelType
from app.models.channel_member import ChannelRole
from app.schemas.user import UserProfile


class ChannelBase(BaseModel):
    """频道基础schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: ChannelType = ChannelType.PUBLIC
    topic: Optional[str] = Field(None, max_length=255)


class ChannelCreate(ChannelBase):
    """频道创建schema"""
    team_id: int


class ChannelUpdate(BaseModel):
    """频道更新schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    topic: Optional[str] = Field(None, max_length=255)
    is_archived: Optional[bool] = None


class ChannelMemberResponse(BaseModel):
    """频道成员响应schema"""
    id: int
    user: UserProfile
    role: ChannelRole
    joined_at: datetime

    class Config:
        from_attributes = True


class ChannelResponse(BaseModel):
    """频道响应schema"""
    id: int
    name: str
    description: Optional[str] = None
    type: ChannelType
    is_active: bool
    is_archived: bool
    topic: Optional[str] = None
    team_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    members: List[ChannelMemberResponse] = []

    class Config:
        from_attributes = True


class ChannelSummary(BaseModel):
    """频道摘要schema"""
    id: int
    name: str
    description: Optional[str] = None
    type: ChannelType
    topic: Optional[str] = None
    is_archived: bool
    member_count: int

    class Config:
        from_attributes = True


class ChannelMemberAdd(BaseModel):
    """添加频道成员schema"""
    user_id: int
    role: ChannelRole = ChannelRole.MEMBER


class ChannelMemberUpdate(BaseModel):
    """更新频道成员schema"""
    role: ChannelRole


class ChannelStats(BaseModel):
    """频道统计schema"""
    member_count: int
    # message_count: int  # 将在消息功能完成后启用 