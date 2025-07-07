"""
频道成员模型
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class ChannelRole(str, Enum):
    """频道角色"""
    ADMIN = "admin"
    MEMBER = "member"


class ChannelMember(Base):
    """频道成员表"""
    __tablename__ = "channel_members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 外键
    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # 角色
    role: Mapped[ChannelRole] = mapped_column(
        SQLEnum(ChannelRole), 
        default=ChannelRole.MEMBER,
        nullable=False
    )
    
    # 时间戳
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    
    # 关系
    channel: Mapped["Channel"] = relationship(
        "Channel", 
        back_populates="members"
    )
    
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="channel_memberships"
    )
    
    def __repr__(self) -> str:
        return f"<ChannelMember(channel_id={self.channel_id}, user_id={self.user_id}, role={self.role})>" 