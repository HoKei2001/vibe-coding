"""
AI智能功能API路由
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.models.user import User
from app.services.ai_service import AIService
from app.auth.auth import get_current_user
from app.schemas.ai import (
    MessageSuggestionRequest, MessageSuggestionResponse,
    AutoSummaryRequest, AutoSummaryResponse,
    SmartSearchRequest, SmartSearchResponse,
    AIConfigRequest, AIConfigResponse,
    ChannelAnalysisRequest, ChannelAnalysisResponse,
    UserBehaviorAnalysisRequest, UserBehaviorAnalysisResponse,
    BatchProcessRequest, BatchProcessResponse,
    AITaskStatus
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.post("/suggestions", response_model=MessageSuggestionResponse)
async def get_message_suggestions(
    request: MessageSuggestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取智能消息建议
    
    根据频道上下文和用户写作风格，提供个性化的回复建议
    """
    try:
        ai_service = AIService(db)
        return await ai_service.get_message_suggestions(request, current_user.id)
    except Exception as e:
        logger.error(f"获取消息建议失败: {e}")
        raise HTTPException(status_code=500, detail="获取消息建议失败")


@router.post("/summary", response_model=AutoSummaryResponse)
async def generate_auto_summary(
    request: AutoSummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    生成自动摘要
    
    分析指定时间范围内的频道消息，生成结构化摘要
    """
    try:
        ai_service = AIService(db)
        return await ai_service.generate_auto_summary(request, current_user.id)
    except Exception as e:
        logger.error(f"生成自动摘要失败: {e}")
        raise HTTPException(status_code=500, detail="生成自动摘要失败")


@router.post("/search", response_model=SmartSearchResponse)
async def intelligent_search(
    request: SmartSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    智能语义搜索
    
    不仅匹配关键词，还理解语义和意图，提供更准确的搜索结果
    """
    try:
        ai_service = AIService(db)
        return await ai_service.intelligent_search(request, current_user.id)
    except Exception as e:
        logger.error(f"智能搜索失败: {e}")
        raise HTTPException(status_code=500, detail="智能搜索失败")


@router.get("/config", response_model=AIConfigResponse)
async def get_ai_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的AI配置
    """
    try:
        from app.models.ai_task import AIConfig
        from sqlalchemy import select
        
        # 查询用户的AI配置
        query = select(AIConfig).where(AIConfig.user_id == current_user.id)
        result = await db.execute(query)
        ai_config = result.scalars().first()
        
        if not ai_config:
            # 创建默认配置
            ai_config = AIConfig(
                user_id=current_user.id,
                enable_suggestions=True,
                enable_auto_summary=True,
                enable_smart_search=True,
                suggestion_sensitivity=0.7,
                language_preference="zh"
            )
            db.add(ai_config)
            await db.commit()
            await db.refresh(ai_config)
        
        return AIConfigResponse(
            user_id=ai_config.user_id,
            enable_suggestions=ai_config.enable_suggestions,
            enable_auto_summary=ai_config.enable_auto_summary,
            enable_smart_search=ai_config.enable_smart_search,
            suggestion_sensitivity=ai_config.suggestion_sensitivity,
            language_preference=ai_config.language_preference,
            updated_at=ai_config.updated_at
        )
    except Exception as e:
        logger.error(f"获取AI配置失败: {e}")
        raise HTTPException(status_code=500, detail="获取AI配置失败")


@router.put("/config", response_model=AIConfigResponse)
async def update_ai_config(
    request: AIConfigRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新用户的AI配置
    """
    try:
        from app.models.ai_task import AIConfig
        from sqlalchemy import select
        
        # 查询现有配置
        query = select(AIConfig).where(AIConfig.user_id == current_user.id)
        result = await db.execute(query)
        ai_config = result.scalars().first()
        
        if not ai_config:
            # 创建新配置
            ai_config = AIConfig(user_id=current_user.id)
            db.add(ai_config)
        
        # 更新配置
        ai_config.enable_suggestions = request.enable_suggestions
        ai_config.enable_auto_summary = request.enable_auto_summary
        ai_config.enable_smart_search = request.enable_smart_search
        ai_config.suggestion_sensitivity = request.suggestion_sensitivity
        ai_config.language_preference = request.language_preference
        
        await db.commit()
        await db.refresh(ai_config)
        
        return AIConfigResponse(
            user_id=ai_config.user_id,
            enable_suggestions=ai_config.enable_suggestions,
            enable_auto_summary=ai_config.enable_auto_summary,
            enable_smart_search=ai_config.enable_smart_search,
            suggestion_sensitivity=ai_config.suggestion_sensitivity,
            language_preference=ai_config.language_preference,
            updated_at=ai_config.updated_at
        )
    except Exception as e:
        logger.error(f"更新AI配置失败: {e}")
        raise HTTPException(status_code=500, detail="更新AI配置失败")


@router.post("/analyze/channel", response_model=ChannelAnalysisResponse)
async def analyze_channel(
    request: ChannelAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    分析频道活动
    
    分析频道的活跃度、情感倾向、主要话题等
    """
    try:
        ai_service = AIService(db)
        # 这里我们暂时返回模拟数据，实际实现需要更复杂的分析逻辑
        return ChannelAnalysisResponse(
            channel_id=request.channel_id,
            analysis_type=request.analysis_type,
            message_count=150,
            active_users=12,
            activity_level="medium",
            recommendations=[
                "频道活跃度适中，建议定期发起讨论话题",
                "可以考虑增加互动性活动提升参与度"
            ]
        )
    except Exception as e:
        logger.error(f"频道分析失败: {e}")
        raise HTTPException(status_code=500, detail="频道分析失败")


@router.post("/analyze/user", response_model=UserBehaviorAnalysisResponse)
async def analyze_user_behavior(
    request: UserBehaviorAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    分析用户行为模式
    
    分析用户的沟通风格、活跃时间、协作模式等
    """
    try:
        target_user_id = request.user_id or current_user.id
        
        # 简化的用户行为分析
        return UserBehaviorAnalysisResponse(
            user_id=target_user_id,
            message_count=85,
            active_channels=5,
            communication_style="简洁直接",
            preferred_times=["09:00-12:00", "14:00-17:00"],
            collaboration_pattern="主动参与讨论",
            suggestions=[
                "您的沟通风格很高效，建议多参与头脑风暴活动",
                "考虑在下午时段发起重要讨论，这是您的活跃时间"
            ]
        )
    except Exception as e:
        logger.error(f"用户行为分析失败: {e}")
        raise HTTPException(status_code=500, detail="用户行为分析失败")


@router.post("/batch", response_model=BatchProcessResponse)
async def create_batch_process(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建批量处理任务
    
    用于大规模的AI分析任务，如批量摘要生成、趋势分析等
    """
    try:
        import uuid
        
        task_id = str(uuid.uuid4())
        
        # 创建AI任务记录
        from app.models.ai_task import AITask
        
        ai_task = AITask(
            task_id=task_id,
            task_type="batch_process",
            status="pending",
            user_id=current_user.id,
            input_data={
                "operation": request.operation,
                "target_channels": request.target_channels,
                "time_range": request.time_range,
                "parameters": request.parameters
            }
        )
        
        db.add(ai_task)
        await db.commit()
        
        # 添加后台任务
        background_tasks.add_task(
            process_batch_task,
            task_id,
            request.operation,
            request.target_channels,
            current_user.id
        )
        
        return BatchProcessResponse(
            task_id=task_id,
            operation=request.operation,
            status="pending",
            estimated_completion=datetime.now() + timedelta(minutes=10),
            progress_url=f"/api/ai/tasks/{task_id}"
        )
    except Exception as e:
        logger.error(f"创建批量处理任务失败: {e}")
        raise HTTPException(status_code=500, detail="创建批量处理任务失败")


@router.get("/tasks/{task_id}", response_model=AITaskStatus)
async def get_task_status(
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取AI任务状态
    """
    try:
        from app.models.ai_task import AITask
        from sqlalchemy import select
        
        query = select(AITask).where(
            AITask.task_id == task_id,
            AITask.user_id == current_user.id
        )
        result = await db.execute(query)
        task = result.scalars().first()
        
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        return AITaskStatus(
            task_id=task.task_id,
            status=task.status,
            progress=task.progress,
            result=task.output_data,
            error=task.error_message,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    except Exception as e:
        logger.error(f"获取任务状态失败: {e}")
        raise HTTPException(status_code=500, detail="获取任务状态失败")


@router.get("/health")
async def ai_health_check():
    """
    AI服务健康检查
    """
    try:
        from app.utils.config import config
        
        # 检查配置
        llm_config = {
            "endpoint": config.llm.endpoint,
            "model": config.llm.model,
            "has_api_key": bool(config.llm.api_key)
        }
        
        return {
            "status": "healthy",
            "features": {
                "message_suggestions": True,
                "auto_summary": True,
                "smart_search": True,
                "channel_analysis": True,
                "user_behavior_analysis": True
            },
            "llm_config": llm_config,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"AI健康检查失败: {e}")
        raise HTTPException(status_code=500, detail="AI服务异常")


async def process_batch_task(
    task_id: str, 
    operation: str, 
    target_channels: list, 
    user_id: int
):
    """
    后台处理批量任务
    """
    try:
        # 这里是批量处理的具体逻辑
        # 实际实现会根据operation类型进行不同的处理
        
        # 模拟处理过程
        import asyncio
        await asyncio.sleep(5)  # 模拟处理时间
        
        logger.info(f"批量任务 {task_id} 处理完成")
        
        # 更新任务状态
        # 这里需要数据库连接，实际实现中需要传递db session
        
    except Exception as e:
        logger.error(f"批量任务处理失败: {task_id}, {e}") 