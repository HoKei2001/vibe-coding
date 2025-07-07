"""
团队模型
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Team(Base):
    """团队表"""
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 团队设置
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # 团队信息
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # 所有者
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
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
    owner: Mapped["User"] = relationship(
        "User", 
        back_populates="owned_teams"
    )
    
    members: Mapped[List["TeamMember"]] = relationship(
        "TeamMember", 
        back_populates="team",
        cascade="all, delete-orphan"
    )
    
    channels: Mapped[List["Channel"]] = relationship(
        "Channel", 
        back_populates="team",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name={self.name}, slug={self.slug})>" 