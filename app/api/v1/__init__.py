"""
API v1 路由
"""
from fastapi import APIRouter

from app.api.v1 import auth, users, teams, channels, messages, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(teams.router, prefix="/teams", tags=["团队"])
api_router.include_router(channels.router, prefix="/channels", tags=["频道"])
api_router.include_router(messages.router, prefix="/messages", tags=["消息"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["通知"]) 