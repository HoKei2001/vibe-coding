"""
用户相关的Pydantic schemas
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """用户基础schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    """用户创建schema"""
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """用户更新schema"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    """用户登录schema"""
    username: str
    password: str


class UserResponse(BaseModel):
    """用户响应schema"""
    id: int
    username: str
    email: str
    full_name: str
    bio: Optional[str] = None
    timezone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """用户资料schema"""
    id: int
    username: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True 