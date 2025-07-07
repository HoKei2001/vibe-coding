"""
消息相关的Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserProfile


class MessageBase(BaseModel):
    """消息基础schema"""
    content: str = Field(..., min_length=1, max_length=4000)


class MessageCreate(MessageBase):
    """消息创建schema"""
    channel_id: int
    parent_id: Optional[int] = None
    attachment_url: Optional[str] = Field(None, max_length=255)
    attachment_type: Optional[str] = Field(None, max_length=50)
    attachment_name: Optional[str] = Field(None, max_length=255)
    attachment_size: Optional[int] = None


class MessageUpdate(BaseModel):
    """消息更新schema"""
    content: str = Field(..., min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    """消息响应schema"""
    id: int
    content: str
    is_edited: bool
    is_deleted: bool
    author_id: int
    channel_id: int
    parent_id: Optional[int] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    author: UserProfile
    replies: List["MessageResponse"] = []

    class Config:
        from_attributes = True


class MessageSummary(BaseModel):
    """消息摘要schema"""
    id: int
    content: str
    author: UserProfile
    created_at: datetime
    reply_count: int

    class Config:
        from_attributes = True


class MessageSearchParams(BaseModel):
    """消息搜索参数schema"""
    query: str = Field(..., min_length=1, max_length=100)
    channel_id: Optional[int] = None
    team_id: Optional[int] = None
    limit: int = Field(20, ge=1, le=100)


class MessageStats(BaseModel):
    """消息统计schema"""
    total_messages: int
    today_messages: int
    attachment_messages: int


class MessageMentions(BaseModel):
    """用户提及消息schema"""
    messages: List[MessageResponse]
    unread_count: int = 0


# 更新前向引用
MessageResponse.model_rebuild() 