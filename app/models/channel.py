"""
频道模型
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class ChannelType(str, Enum):
    """频道类型"""
    PUBLIC = "public"
    PRIVATE = "private"
    DIRECT = "direct"


class Channel(Base):
    """频道表"""
    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 频道类型和设置
    type: Mapped[ChannelType] = mapped_column(
        SQLEnum(ChannelType), 
        default=ChannelType.PUBLIC,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 频道信息
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # 所属团队
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    
    # 创建者
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # 关系
    team: Mapped["Team"] = relationship(
        "Team", 
        back_populates="channels"
    )
    
    creator: Mapped["User"] = relationship(
        "User", 
        foreign_keys=[created_by]
    )
    
    members: Mapped[List["ChannelMember"]] = relationship(
        "ChannelMember", 
        back_populates="channel",
        cascade="all, delete-orphan"
    )
    
    messages: Mapped[List["Message"]] = relationship(
        "Message", 
        back_populates="channel",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Channel(id={self.id}, name={self.name}, type={self.type})>" 