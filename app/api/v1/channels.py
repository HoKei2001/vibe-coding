"""
频道API路由
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User
from app.models.channel_member import ChannelRole
from app.schemas.channel import (
    ChannelCreate, ChannelUpdate, ChannelResponse, ChannelSummary,
    ChannelMemberAdd, ChannelMemberUpdate, ChannelMemberResponse, ChannelStats
)
from app.services.channel_service import ChannelService

router = APIRouter()


@router.get("", response_model=List[ChannelResponse])
async def get_channels(
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    include_archived: bool = Query(False, description="Include archived channels"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道列表"""
    channel_service = ChannelService(db)
    
    if team_id:
        channels = await channel_service.get_team_channels(
            team_id, current_user.id, include_archived=include_archived
        )
    else:
        channels = await channel_service.get_user_channels(
            current_user.id, skip=skip, limit=limit
        )
    
    return channels


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    channel_create: ChannelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建频道"""
    channel_service = ChannelService(db)
    
    try:
        channel = await channel_service.create_channel(channel_create, current_user.id)
        return channel
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道详情"""
    channel_service = ChannelService(db)
    
    channel = await channel_service.get_channel_by_id(channel_id)
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )
    
    # 检查访问权限
    if not await channel_service.can_user_access_channel(channel_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return channel


@router.put("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: int,
    channel_update: ChannelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新频道信息"""
    channel_service = ChannelService(db)
    
    try:
        channel = await channel_service.update_channel(channel_id, channel_update, current_user.id)
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        return channel
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{channel_id}/archive")
async def archive_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """归档频道"""
    channel_service = ChannelService(db)
    
    try:
        success = await channel_service.archive_channel(channel_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        return {"message": "Channel archived successfully"}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{channel_id}")
async def delete_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除频道"""
    channel_service = ChannelService(db)
    
    try:
        success = await channel_service.delete_channel(channel_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found"
            )
        return {"message": "Channel deleted successfully"}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{channel_id}/members", response_model=List[ChannelMemberResponse])
async def get_channel_members(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道成员列表"""
    channel_service = ChannelService(db)
    
    # 检查用户是否可以访问频道
    if not await channel_service.can_user_access_channel(channel_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    members = await channel_service.get_channel_members(channel_id)
    return members


@router.post("/{channel_id}/members", response_model=ChannelMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_channel_member(
    channel_id: int,
    member_add: ChannelMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """添加频道成员"""
    channel_service = ChannelService(db)
    
    try:
        member = await channel_service.add_channel_member(
            channel_id, member_add.user_id, current_user.id, member_add.role
        )
        return member
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{channel_id}/members/{user_id}")
async def remove_channel_member(
    channel_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """移除频道成员"""
    channel_service = ChannelService(db)
    
    try:
        success = await channel_service.remove_channel_member(channel_id, user_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel member not found"
            )
        return {"message": "Channel member removed successfully"}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/{channel_id}/members/{user_id}", response_model=ChannelMemberResponse)
async def update_member_role(
    channel_id: int,
    user_id: int,
    member_update: ChannelMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新成员角色"""
    channel_service = ChannelService(db)
    
    try:
        member = await channel_service.update_member_role(
            channel_id, user_id, member_update.role, current_user.id
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel member not found"
            )
        return member
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/team/{team_id}/search", response_model=List[ChannelSummary])
async def search_channels(
    team_id: int,
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """搜索团队频道"""
    channel_service = ChannelService(db)
    channels = await channel_service.search_channels(team_id, current_user.id, q, limit)
    
    # 转换为ChannelSummary格式
    channel_summaries = []
    for channel in channels:
        stats = await channel_service.get_channel_stats(channel.id)
        channel_summary = ChannelSummary(
            id=channel.id,
            name=channel.name,
            description=channel.description,
            type=channel.type,
            topic=channel.topic,
            is_archived=channel.is_archived,
            member_count=stats["member_count"]
        )
        channel_summaries.append(channel_summary)
    
    return channel_summaries


@router.get("/{channel_id}/stats", response_model=ChannelStats)
async def get_channel_stats(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取频道统计信息"""
    channel_service = ChannelService(db)
    
    # 检查用户是否可以访问频道
    if not await channel_service.can_user_access_channel(channel_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    stats = await channel_service.get_channel_stats(channel_id)
    return ChannelStats(**stats) 