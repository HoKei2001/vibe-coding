"""
通知模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class NotificationType(str, Enum):
    """通知类型"""
    TEAM_INVITE = "team_invite"
    CHANNEL_INVITE = "channel_invite"
    MESSAGE_MENTION = "message_mention"
    SYSTEM = "system"


class Notification(Base):
    """通知表"""
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 接收者
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    
    # 通知类型
    type: Mapped[NotificationType] = mapped_column(
        String(50), 
        nullable=False
    )
    
    # 通知内容
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # 状态
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 额外数据（JSON格式）
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
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
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="notifications"
    )
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, is_read={self.is_read})>" 