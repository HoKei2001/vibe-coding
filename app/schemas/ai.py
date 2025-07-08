"""
AI服务相关的Pydantic schemas
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


# 消息建议相关 Schema
class MessageSuggestionRequest(BaseModel):
    """消息建议请求"""
    channel_id: int = Field(..., description="频道ID")
    topic: Optional[str] = Field(None, description="当前话题")
    context: Optional[str] = Field(None, description="额外上下文")


class MessageSuggestionResponse(BaseModel):
    """消息建议响应"""
    suggestions: List[str] = Field(..., description="建议的回复列表")
    confidence: float = Field(..., description="置信度 (0-1)")
    context_used: int = Field(..., description="使用的上下文消息数量")


# 自动摘要相关 Schema
class AutoSummaryRequest(BaseModel):
    """自动摘要请求"""
    channel_id: int = Field(..., description="频道ID")
    start_time: datetime = Field(..., description="开始时间")
    end_time: datetime = Field(..., description="结束时间")
    summary_type: str = Field(default="meeting", description="摘要类型: meeting, discussion, decision")


class AutoSummaryResponse(BaseModel):
    """自动摘要响应"""
    summary: str = Field(..., description="主要摘要")
    key_points: List[str] = Field(..., description="关键要点")
    action_items: List[str] = Field(..., description="行动项目")
    participants: List[str] = Field(..., description="参与者列表")
    message_count: int = Field(..., description="消息总数")


# 智能搜索相关 Schema
class SmartSearchRequest(BaseModel):
    """智能搜索请求"""
    query: str = Field(..., description="搜索查询")
    channels: Optional[List[int]] = Field(None, description="限制搜索的频道")
    time_range: Optional[Dict[str, datetime]] = Field(None, description="时间范围")
    search_type: str = Field(default="semantic", description="搜索类型: semantic, keyword, mixed")


class SearchResult(BaseModel):
    """搜索结果项"""
    message_id: int = Field(..., description="消息ID")
    content: str = Field(..., description="消息内容")
    author: str = Field(..., description="作者")
    channel_name: str = Field(..., description="频道名称")
    timestamp: str = Field(..., description="时间戳")
    relevance_score: float = Field(..., description="相关性评分")
    highlight: Optional[str] = Field(None, description="高亮片段")


class SmartSearchResponse(BaseModel):
    """智能搜索响应"""
    results: List[SearchResult] = Field(..., description="搜索结果")
    total_count: int = Field(..., description="结果总数")
    search_type: str = Field(..., description="实际使用的搜索类型")
    query_understanding: str = Field(..., description="查询理解")
    suggestions: Optional[List[str]] = Field(None, description="搜索建议")


# AI任务状态 Schema
class AITaskStatus(BaseModel):
    """AI任务状态"""
    task_id: str = Field(..., description="任务ID")
    status: str = Field(..., description="状态: pending, processing, completed, failed")
    progress: float = Field(default=0.0, description="进度 (0-1)")
    result: Optional[Dict[str, Any]] = Field(None, description="结果数据")
    error: Optional[str] = Field(None, description="错误信息")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")


# AI分析相关 Schema
class ChannelAnalysisRequest(BaseModel):
    """频道分析请求"""
    channel_id: int = Field(..., description="频道ID")
    analysis_type: str = Field(..., description="分析类型: activity, sentiment, topics, productivity")
    time_range: Optional[Dict[str, datetime]] = Field(None, description="分析时间范围")


class SentimentAnalysis(BaseModel):
    """情感分析结果"""
    positive: float = Field(..., description="积极情感比例")
    neutral: float = Field(..., description="中性情感比例")
    negative: float = Field(..., description="消极情感比例")
    overall_sentiment: str = Field(..., description="整体情感倾向")


class TopicAnalysis(BaseModel):
    """话题分析结果"""
    topic: str = Field(..., description="话题名称")
    frequency: int = Field(..., description="出现频次")
    relevance: float = Field(..., description="相关性")
    trend: str = Field(..., description="趋势: rising, stable, declining")


class ChannelAnalysisResponse(BaseModel):
    """频道分析响应"""
    channel_id: int = Field(..., description="频道ID")
    analysis_type: str = Field(..., description="分析类型")
    message_count: int = Field(..., description="分析的消息数量")
    active_users: int = Field(..., description="活跃用户数")
    sentiment: Optional[SentimentAnalysis] = Field(None, description="情感分析")
    topics: Optional[List[TopicAnalysis]] = Field(None, description="话题分析")
    activity_level: Optional[str] = Field(None, description="活跃度: low, medium, high")
    recommendations: List[str] = Field(default=[], description="AI建议")


# 用户行为分析 Schema
class UserBehaviorAnalysisRequest(BaseModel):
    """用户行为分析请求"""
    user_id: Optional[int] = Field(None, description="用户ID，不提供则分析当前用户")
    time_range: Optional[Dict[str, datetime]] = Field(None, description="分析时间范围")


class UserBehaviorAnalysisResponse(BaseModel):
    """用户行为分析响应"""
    user_id: int = Field(..., description="用户ID")
    message_count: int = Field(..., description="消息数量")
    active_channels: int = Field(..., description="活跃频道数")
    communication_style: str = Field(..., description="沟通风格")
    preferred_times: List[str] = Field(..., description="活跃时间段")
    collaboration_pattern: str = Field(..., description="协作模式")
    suggestions: List[str] = Field(..., description="个性化建议")


# AI配置 Schema
class AIConfigRequest(BaseModel):
    """AI配置请求"""
    enable_suggestions: bool = Field(default=True, description="启用消息建议")
    enable_auto_summary: bool = Field(default=True, description="启用自动摘要")
    enable_smart_search: bool = Field(default=True, description="启用智能搜索")
    suggestion_sensitivity: float = Field(default=0.7, description="建议敏感度")
    language_preference: str = Field(default="zh", description="语言偏好")


class AIConfigResponse(BaseModel):
    """AI配置响应"""
    user_id: int = Field(..., description="用户ID")
    enable_suggestions: bool = Field(..., description="启用消息建议")
    enable_auto_summary: bool = Field(..., description="启用自动摘要")
    enable_smart_search: bool = Field(..., description="启用智能搜索")
    suggestion_sensitivity: float = Field(..., description="建议敏感度")
    language_preference: str = Field(..., description="语言偏好")
    updated_at: datetime = Field(..., description="更新时间")


# 批量处理 Schema
class BatchProcessRequest(BaseModel):
    """批量处理请求"""
    operation: str = Field(..., description="操作类型: summarize_all, analyze_trends, extract_insights")
    target_channels: Optional[List[int]] = Field(None, description="目标频道")
    time_range: Optional[Dict[str, datetime]] = Field(None, description="时间范围")
    parameters: Optional[Dict[str, Any]] = Field(None, description="额外参数")


class BatchProcessResponse(BaseModel):
    """批量处理响应"""
    task_id: str = Field(..., description="任务ID")
    operation: str = Field(..., description="操作类型")
    status: str = Field(..., description="任务状态")
    estimated_completion: Optional[datetime] = Field(None, description="预计完成时间")
    progress_url: str = Field(..., description="进度查询URL") 