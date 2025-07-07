"""
团队API路由
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User
from app.models.team_member import TeamRole
from app.schemas.team import (
    TeamCreate, TeamUpdate, TeamResponse, TeamSummary,
    TeamMemberAdd, TeamMemberUpdate, TeamMemberResponse, TeamStats
)
from app.services.team_service import TeamService

router = APIRouter()


@router.get("", response_model=List[TeamResponse])
async def get_teams(
    public_only: bool = Query(False, description="Only return public teams"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取团队列表"""
    team_service = TeamService(db)
    
    if public_only:
        teams = await team_service.get_public_teams(skip=skip, limit=limit)
    else:
        teams = await team_service.get_user_teams(current_user.id, skip=skip, limit=limit)
    
    return teams


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_create: TeamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建团队"""
    team_service = TeamService(db)
    
    try:
        team = await team_service.create_team(team_create, current_user.id)
        return team
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取团队详情"""
    team_service = TeamService(db)
    
    team = await team_service.get_team_by_id(team_id)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # 检查权限（公开团队或团队成员可以查看）
    if not team.is_public:
        is_member = await team_service.check_team_permission(
            team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return team


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新团队信息"""
    team_service = TeamService(db)
    
    try:
        team = await team_service.update_team(team_id, team_update, current_user.id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        return team
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除团队"""
    team_service = TeamService(db)
    
    try:
        success = await team_service.delete_team(team_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        return {"message": "Team deleted successfully"}
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/slug/{slug}", response_model=TeamResponse)
async def get_team_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """根据slug获取团队"""
    team_service = TeamService(db)
    
    team = await team_service.get_team_by_slug(slug)
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # 检查权限（公开团队或团队成员可以查看）
    if not team.is_public:
        is_member = await team_service.check_team_permission(
            team.id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
        )
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return team


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取团队成员列表"""
    team_service = TeamService(db)
    
    # 检查用户是否是团队成员
    is_member = await team_service.check_team_permission(
        team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    members = await team_service.get_team_members(team_id)
    return members


@router.post("/{team_id}/members", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_team_member(
    team_id: int,
    member_add: TeamMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """添加团队成员"""
    team_service = TeamService(db)
    
    try:
        member = await team_service.add_team_member(
            team_id, member_add.user_id, current_user.id, member_add.role
        )
        return member
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """移除团队成员"""
    team_service = TeamService(db)
    
    try:
        success = await team_service.remove_team_member(team_id, user_id, current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        return {"message": "Team member removed successfully"}
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/{team_id}/members/{user_id}", response_model=TeamMemberResponse)
async def update_member_role(
    team_id: int,
    user_id: int,
    member_update: TeamMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新成员角色"""
    team_service = TeamService(db)
    
    try:
        member = await team_service.update_member_role(
            team_id, user_id, member_update.role, current_user.id
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found"
            )
        return member
    except (PermissionError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST if isinstance(e, ValueError) else status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/search", response_model=List[TeamSummary])
async def search_teams(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """搜索公开团队"""
    team_service = TeamService(db)
    teams = await team_service.search_teams(q, limit)
    
    # 转换为TeamSummary格式
    team_summaries = []
    for team in teams:
        stats = await team_service.get_team_stats(team.id)
        team_summary = TeamSummary(
            id=team.id,
            name=team.name,
            slug=team.slug,
            description=team.description,
            avatar_url=team.avatar_url,
            is_public=team.is_public,
            member_count=stats["member_count"]
        )
        team_summaries.append(team_summary)
    
    return team_summaries


@router.get("/{team_id}/stats", response_model=TeamStats)
async def get_team_stats(
    team_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取团队统计信息"""
    team_service = TeamService(db)
    
    # 检查用户是否是团队成员
    is_member = await team_service.check_team_permission(
        team_id, current_user.id, [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER, TeamRole.GUEST]
    )
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    stats = await team_service.get_team_stats(team_id)
    return TeamStats(**stats) 