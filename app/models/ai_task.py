"""
AI任务相关数据库模型
"""
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Boolean, DateTime, String, Text, Integer, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class AITask(Base):
    """AI任务表"""
    __tablename__ = "ai_tasks"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    
    # 任务信息
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)  # suggestion, summary, search, analysis
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, processing, completed, failed
    progress: Mapped[float] = mapped_column(default=0.0, nullable=False)
    
    # 关联信息
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    channel_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # 任务数据
    input_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    output_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self) -> str:
        return f"<AITask(id={self.id}, task_id={self.task_id}, type={self.task_type}, status={self.status})>"


class AIConfig(Base):
    """AI配置表"""
    __tablename__ = "ai_configs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    
    # AI功能开关
    enable_suggestions: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_auto_summary: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_smart_search: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_behavior_analysis: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # AI参数配置
    suggestion_sensitivity: Mapped[float] = mapped_column(default=0.7, nullable=False)
    language_preference: Mapped[str] = mapped_column(String(10), default="zh", nullable=False)
    
    # 个性化配置
    preferred_suggestion_style: Mapped[str] = mapped_column(String(50), default="balanced", nullable=False)
    max_suggestions_per_request: Mapped[int] = mapped_column(default=3, nullable=False)
    
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
    
    def __repr__(self) -> str:
        return f"<AIConfig(user_id={self.user_id}, suggestions={self.enable_suggestions})>"


class MessageSuggestionLog(Base):
    """消息建议日志表"""
    __tablename__ = "message_suggestion_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 关联信息
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    channel_id: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # 建议信息
    suggestions: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    selected_suggestion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    was_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # 上下文信息
    context_message_count: Mapped[int] = mapped_column(default=0, nullable=False)
    confidence_score: Mapped[float] = mapped_column(default=0.0, nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<MessageSuggestionLog(id={self.id}, user_id={self.user_id}, used={self.was_used})>"


class ChannelSummary(Base):
    """频道摘要表"""
    __tablename__ = "channel_summaries"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # 关联信息
    channel_id: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_by: Mapped[int] = mapped_column(Integer, nullable=False)  # 生成者用户ID
    
    # 摘要信息
    summary_type: Mapped[str] = mapped_column(String(50), default="meeting", nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary_content: Mapped[str] = mapped_column(Text, nullable=False)
    key_points: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    action_items: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    
    # 统计信息
    message_count: Mapped[int] = mapped_column(default=0, nullable=False)
    participant_count: Mapped[int] = mapped_column(default=0, nullable=False)
    participants: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    
    # 时间范围
    summary_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    summary_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    
    def __repr__(self) -> str:
        return f"<ChannelSummary(id={self.id}, channel_id={self.channel_id}, type={self.summary_type})>" 