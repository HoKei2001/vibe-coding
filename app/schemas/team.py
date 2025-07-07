"""
团队相关的Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.team_member import TeamRole
from app.schemas.user import UserProfile


class TeamBase(BaseModel):
    """团队基础schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = False
    avatar_url: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)


class TeamCreate(TeamBase):
    """团队创建schema"""
    slug: str = Field(..., min_length=3, max_length=100, pattern=r'^[a-z0-9-]+$')


class TeamUpdate(BaseModel):
    """团队更新schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    avatar_url: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)


class TeamMemberResponse(BaseModel):
    """团队成员响应schema"""
    id: int
    user: UserProfile
    role: TeamRole
    joined_at: datetime

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    """团队响应schema"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    is_public: bool
    avatar_url: Optional[str] = None
    website: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: datetime
    members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    """团队摘要schema"""
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: bool
    member_count: int

    class Config:
        from_attributes = True


class TeamMemberAdd(BaseModel):
    """添加团队成员schema"""
    user_id: int
    role: TeamRole = TeamRole.MEMBER


class TeamMemberUpdate(BaseModel):
    """更新团队成员schema"""
    role: TeamRole


class TeamStats(BaseModel):
    """团队统计schema"""
    member_count: int
    # channel_count: int  # 将在频道功能完成后启用 