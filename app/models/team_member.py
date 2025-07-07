"""
团队成员模型
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class TeamRole(str, Enum):
    """团队角色"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"


class TeamMember(Base):
    """团队成员表"""
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 外键
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    # 角色
    role: Mapped[TeamRole] = mapped_column(
        SQLEnum(TeamRole), 
        default=TeamRole.MEMBER,
        nullable=False
    )
    
    # 时间戳
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    
    # 关系
    team: Mapped["Team"] = relationship(
        "Team", 
        back_populates="members"
    )
    
    user: Mapped["User"] = relationship(
        "User", 
        back_populates="team_memberships"
    )
    
    def __repr__(self) -> str:
        return f"<TeamMember(team_id={self.team_id}, user_id={self.user_id}, role={self.role})>" 