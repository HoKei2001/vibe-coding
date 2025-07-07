"""
认证API路由
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_active_user,
)
from app.database.database import get_db
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import UserService

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_create: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """用户注册"""
    user_service = UserService(db)
    
    try:
        user = await user_service.create_user(user_create)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
async def login(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """用户登录"""
    user = await authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[UserResponse, Depends(get_current_active_user)]
):
    """获取当前用户信息"""
    return current_user


@router.post("/logout")
async def logout(
    current_user: Annotated[UserResponse, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db)
):
    """用户登出"""
    # 更新用户离线状态
    user_service = UserService(db)
    await user_service.update_user_online_status(current_user.id, False)
    
    return {"message": "Successfully logged out"} 