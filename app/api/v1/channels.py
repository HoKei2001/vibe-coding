"""
频道API路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("")
async def get_channels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道列表"""
    # TODO: 实现频道服务和逻辑
    return {"message": "Channels endpoint - to be implemented"}


@router.post("")
async def create_channel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建频道"""
    # TODO: 实现频道创建逻辑
    return {"message": "Create channel endpoint - to be implemented"} 