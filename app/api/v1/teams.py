"""
团队API路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("")
async def get_teams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取团队列表"""
    # TODO: 实现团队服务和逻辑
    return {"message": "Teams endpoint - to be implemented"}


@router.post("")
async def create_team(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建团队"""
    # TODO: 实现团队创建逻辑
    return {"message": "Create team endpoint - to be implemented"} 