"""
消息API路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("")
async def get_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取消息列表"""
    # TODO: 实现消息服务和逻辑
    return {"message": "Messages endpoint - to be implemented"}


@router.post("")
async def create_message(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """发送消息"""
    # TODO: 实现消息发送逻辑
    return {"message": "Create message endpoint - to be implemented"} 