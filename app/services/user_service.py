"""
用户服务
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.utils.password import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """用户服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, user_create: UserCreate) -> User:
        """创建用户"""
        # 检查用户名是否已存在
        existing_user = await self.get_user_by_username(user_create.username)
        if existing_user:
            raise ValueError("Username already exists")
        
        # 检查邮箱是否已存在
        existing_email = await self.get_user_by_email(user_create.email)
        if existing_email:
            raise ValueError("Email already exists")
        
        # 创建用户
        hashed_password = get_password_hash(user_create.password)
        db_user = User(
            username=user_create.username,
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hashed_password,
            bio=user_create.bio,
            timezone=user_create.timezone,
            avatar_url=user_create.avatar_url,
        )
        
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """获取用户列表"""
        query = select(User).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_user(self, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """更新用户"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        # 更新字段
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False
        
        await self.db.delete(user)
        await self.db.commit()
        return True
    
    async def search_users(self, query: str, limit: int = 10) -> List[User]:
        """搜索用户"""
        search_query = select(User).where(
            User.username.ilike(f"%{query}%") |
            User.full_name.ilike(f"%{query}%")
        ).limit(limit)
        
        result = await self.db.execute(search_query)
        return result.scalars().all()
    
    async def update_user_online_status(self, user_id: int, is_online: bool) -> Optional[User]:
        """更新用户在线状态"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        user.is_online = is_online
        if not is_online:
            from datetime import datetime
            user.last_seen = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(user)
        return user 