"""
通知API路由
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import get_current_active_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationUpdate
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取用户通知列表"""
    notification_service = NotificationService(db)
    notifications = await notification_service.get_user_notifications(
        current_user.id, skip=skip, limit=limit, unread_only=unread_only
    )
    return notifications


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取未读通知数量"""
    notification_service = NotificationService(db)
    count = await notification_service.get_unread_count(current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新通知状态"""
    notification_service = NotificationService(db)
    
    if notification_update.is_read is not None:
        notification = await notification_service.mark_notification_as_read(
            notification_id, current_user.id
        )
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        return notification
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No valid update data provided"
    )


@router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """标记所有通知为已读"""
    notification_service = NotificationService(db)
    count = await notification_service.mark_all_notifications_as_read(current_user.id)
    return {"marked_count": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除通知"""
    notification_service = NotificationService(db)
    success = await notification_service.delete_notification(notification_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification deleted successfully"}


@router.post("/{notification_id}/respond")
async def respond_to_invitation(
    notification_id: int,
    accepted: bool = Query(..., description="Whether to accept the invitation"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """响应邀请通知"""
    notification_service = NotificationService(db)
    success = await notification_service.handle_team_invite_response(
        notification_id, current_user.id, accepted
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to respond to invitation"
        )
    
    action = "accepted" if accepted else "declined"
    return {"message": f"Invitation {action} successfully"} 