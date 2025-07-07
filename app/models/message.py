"""
消息模型
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Message(Base):
    """消息表"""
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # 消息类型和状态
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 外键
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id"), nullable=False)
    
    # 回复消息
    parent_id: Mapped[Optional[int]] = mapped_column(ForeignKey("messages.id"), nullable=True)
    
    # 附件信息
    attachment_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    attachment_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    attachment_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    attachment_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
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
    author: Mapped["User"] = relationship(
        "User", 
        back_populates="messages"
    )
    
    channel: Mapped["Channel"] = relationship(
        "Channel", 
        back_populates="messages"
    )
    
    parent: Mapped[Optional["Message"]] = relationship(
        "Message", 
        remote_side=[id],
        back_populates="replies"
    )
    
    replies: Mapped[list["Message"]] = relationship(
        "Message", 
        back_populates="parent",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Message(id={self.id}, author_id={self.author_id}, channel_id={self.channel_id})>" 