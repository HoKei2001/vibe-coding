"""
用户服务测试
"""
import pytest
from unittest.mock import patch

from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User


class TestUserService:
    """用户服务测试"""
    
    @pytest.mark.asyncio
    async def test_create_user_success(self, test_db):
        """测试创建用户成功"""
        user_service = UserService(test_db)
        user_create = UserCreate(
            username="newuser",
            email="newuser@example.com",
            full_name="New User",
            password="password123",
            bio="New user bio",
            timezone="UTC"
        )
        
        user = await user_service.create_user(user_create)
        
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.full_name == "New User"
        assert user.bio == "New user bio"
        assert user.timezone == "UTC"
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_online is False
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_username(self, test_db, test_user):
        """测试创建用户失败 - 用户名重复"""
        user_service = UserService(test_db)
        user_create = UserCreate(
            username="testuser",  # 已存在的用户名
            email="different@example.com",
            full_name="Different User",
            password="password123"
        )
        
        with pytest.raises(ValueError, match="Username already exists"):
            await user_service.create_user(user_create)
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, test_db, test_user):
        """测试创建用户失败 - 邮箱重复"""
        user_service = UserService(test_db)
        user_create = UserCreate(
            username="differentuser",
            email="test@example.com",  # 已存在的邮箱
            full_name="Different User",
            password="password123"
        )
        
        with pytest.raises(ValueError, match="Email already exists"):
            await user_service.create_user(user_create)
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, test_db, test_user):
        """测试根据ID获取用户成功"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_id(test_user.id)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username
        assert user.email == test_user.email
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, test_db):
        """测试根据ID获取用户失败 - 用户不存在"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_id(999)
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_username_success(self, test_db, test_user):
        """测试根据用户名获取用户成功"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_username(test_user.username)
        
        assert user is not None
        assert user.username == test_user.username
        assert user.email == test_user.email
    
    @pytest.mark.asyncio
    async def test_get_user_by_username_not_found(self, test_db):
        """测试根据用户名获取用户失败 - 用户不存在"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_username("nonexistent")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_success(self, test_db, test_user):
        """测试根据邮箱获取用户成功"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_email(test_user.email)
        
        assert user is not None
        assert user.email == test_user.email
        assert user.username == test_user.username
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, test_db):
        """测试根据邮箱获取用户失败 - 用户不存在"""
        user_service = UserService(test_db)
        
        user = await user_service.get_user_by_email("nonexistent@example.com")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_users_success(self, test_db, test_user, test_user_2):
        """测试获取用户列表成功"""
        user_service = UserService(test_db)
        
        users = await user_service.get_users()
        
        assert len(users) == 2
        usernames = [user.username for user in users]
        assert "testuser" in usernames
        assert "testuser2" in usernames
    
    @pytest.mark.asyncio
    async def test_get_users_with_pagination(self, test_db, test_user, test_user_2):
        """测试获取用户列表分页"""
        user_service = UserService(test_db)
        
        # 测试skip和limit
        users = await user_service.get_users(skip=0, limit=1)
        assert len(users) == 1
        
        users = await user_service.get_users(skip=1, limit=1)
        assert len(users) == 1
    
    @pytest.mark.asyncio
    async def test_update_user_success(self, test_db, test_user):
        """测试更新用户成功"""
        user_service = UserService(test_db)
        user_update = UserUpdate(
            full_name="Updated User",
            bio="Updated bio",
            timezone="America/New_York"
        )
        
        updated_user = await user_service.update_user(test_user.id, user_update)
        
        assert updated_user is not None
        assert updated_user.full_name == "Updated User"
        assert updated_user.bio == "Updated bio"
        assert updated_user.timezone == "America/New_York"
        # 其他字段应该保持不变
        assert updated_user.username == test_user.username
        assert updated_user.email == test_user.email
    
    @pytest.mark.asyncio
    async def test_update_user_not_found(self, test_db):
        """测试更新用户失败 - 用户不存在"""
        user_service = UserService(test_db)
        user_update = UserUpdate(full_name="Updated User")
        
        updated_user = await user_service.update_user(999, user_update)
        
        assert updated_user is None
    
    @pytest.mark.asyncio
    async def test_update_user_partial_update(self, test_db, test_user):
        """测试更新用户部分字段"""
        user_service = UserService(test_db)
        user_update = UserUpdate(bio="Only bio updated")
        
        updated_user = await user_service.update_user(test_user.id, user_update)
        
        assert updated_user is not None
        assert updated_user.bio == "Only bio updated"
        # 其他字段应该保持不变
        assert updated_user.full_name == test_user.full_name
        assert updated_user.timezone == test_user.timezone
    
    @pytest.mark.asyncio
    async def test_delete_user_success(self, test_db, test_user):
        """测试删除用户成功"""
        user_service = UserService(test_db)
        
        result = await user_service.delete_user(test_user.id)
        
        assert result is True
        
        # 验证用户已被删除
        deleted_user = await user_service.get_user_by_id(test_user.id)
        assert deleted_user is None
    
    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, test_db):
        """测试删除用户失败 - 用户不存在"""
        user_service = UserService(test_db)
        
        result = await user_service.delete_user(999)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_search_users_success(self, test_db, test_user, test_user_2):
        """测试搜索用户成功"""
        user_service = UserService(test_db)
        
        # 搜索用户名
        users = await user_service.search_users("testuser")
        assert len(users) == 2  # testuser和testuser2
        
        # 搜索全名
        users = await user_service.search_users("Test User")
        assert len(users) == 2
        
        # 精确搜索
        users = await user_service.search_users("testuser2")
        assert len(users) == 1
        assert users[0].username == "testuser2"
    
    @pytest.mark.asyncio
    async def test_search_users_no_results(self, test_db, test_user):
        """测试搜索用户无结果"""
        user_service = UserService(test_db)
        
        users = await user_service.search_users("nonexistent")
        assert len(users) == 0
    
    @pytest.mark.asyncio
    async def test_search_users_with_limit(self, test_db, test_user, test_user_2):
        """测试搜索用户带限制"""
        user_service = UserService(test_db)
        
        users = await user_service.search_users("testuser", limit=1)
        assert len(users) == 1
    
    @pytest.mark.asyncio
    async def test_update_user_online_status_online(self, test_db, test_user):
        """测试更新用户在线状态 - 设置为在线"""
        user_service = UserService(test_db)
        
        updated_user = await user_service.update_user_online_status(test_user.id, True)
        
        assert updated_user is not None
        assert updated_user.is_online is True
    
    @pytest.mark.asyncio
    async def test_update_user_online_status_offline(self, test_db, test_user):
        """测试更新用户在线状态 - 设置为离线"""
        user_service = UserService(test_db)
        
        updated_user = await user_service.update_user_online_status(test_user.id, False)
        
        assert updated_user is not None
        assert updated_user.is_online is False
        assert updated_user.last_seen is not None
    
    @pytest.mark.asyncio
    async def test_update_user_online_status_not_found(self, test_db):
        """测试更新用户在线状态失败 - 用户不存在"""
        user_service = UserService(test_db)
        
        updated_user = await user_service.update_user_online_status(999, True)
        
        assert updated_user is None


class TestUserServiceEdgeCases:
    """用户服务边界情况测试"""
    
    @pytest.mark.asyncio
    async def test_create_user_with_minimal_data(self, test_db):
        """测试创建用户最小数据"""
        user_service = UserService(test_db)
        user_create = UserCreate(
            username="minimal",
            email="minimal@example.com",
            full_name="Minimal User",
            password="password123"
        )
        
        user = await user_service.create_user(user_create)
        
        assert user.username == "minimal"
        assert user.email == "minimal@example.com"
        assert user.full_name == "Minimal User"
        assert user.bio is None
        assert user.timezone is None
        assert user.avatar_url is None
    
    @pytest.mark.asyncio
    async def test_update_user_empty_update(self, test_db, test_user):
        """测试更新用户空更新"""
        user_service = UserService(test_db)
        user_update = UserUpdate()
        
        updated_user = await user_service.update_user(test_user.id, user_update)
        
        assert updated_user is not None
        # 所有字段应该保持不变
        assert updated_user.full_name == test_user.full_name
        assert updated_user.bio == test_user.bio
        assert updated_user.timezone == test_user.timezone
    
    @pytest.mark.asyncio
    async def test_search_users_case_insensitive(self, test_db, test_user):
        """测试搜索用户不区分大小写"""
        user_service = UserService(test_db)
        
        users = await user_service.search_users("TESTUSER")
        assert len(users) == 1
        assert users[0].username == "testuser"
        
        users = await user_service.search_users("TEST USER")
        assert len(users) == 1
        assert users[0].full_name == "Test User" 