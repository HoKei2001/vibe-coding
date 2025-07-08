"""
认证API测试
"""
import pytest
from unittest.mock import patch

from app.schemas.user import UserCreate


class TestAuthAPI:
    """认证API测试"""
    
    @pytest.mark.asyncio
    async def test_register_success(self, client, sample_user_data):
        """测试用户注册成功"""
        response = await client.post("/api/v1/auth/register", json=sample_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
        assert data["bio"] == sample_user_data["bio"]
        assert data["timezone"] == sample_user_data["timezone"]
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert data["is_online"] is False
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        # 确保密码没有返回
        assert "password" not in data
        assert "hashed_password" not in data
    
    @pytest.mark.asyncio
    async def test_register_duplicate_username(self, client, sample_user_data, test_user):
        """测试用户注册失败 - 用户名重复"""
        sample_user_data["username"] = "testuser"  # 已存在的用户名
        
        response = await client.post("/api/v1/auth/register", json=sample_user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Username already exists" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, sample_user_data, test_user):
        """测试用户注册失败 - 邮箱重复"""
        sample_user_data["email"] = "test@example.com"  # 已存在的邮箱
        
        response = await client.post("/api/v1/auth/register", json=sample_user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Email already exists" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client, sample_user_data):
        """测试用户注册失败 - 邮箱格式错误"""
        sample_user_data["email"] = "invalid-email"
        
        response = await client.post("/api/v1/auth/register", json=sample_user_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_register_short_password(self, client, sample_user_data):
        """测试用户注册失败 - 密码太短"""
        sample_user_data["password"] = "12345"  # 少于6个字符
        
        response = await client.post("/api/v1/auth/register", json=sample_user_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_register_missing_required_fields(self, client):
        """测试用户注册失败 - 缺少必需字段"""
        incomplete_data = {
            "username": "testuser",
            # 缺少email, full_name, password
        }
        
        response = await client.post("/api/v1/auth/register", json=incomplete_data)
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_login_success(self, client, sample_login_data, test_user):
        """测试用户登录成功"""
        response = await client.post("/api/v1/auth/login", json=sample_login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
    
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, test_user):
        """测试用户登录失败 - 密码错误"""
        login_data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "Incorrect username or password" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        """测试用户登录失败 - 用户不存在"""
        login_data = {
            "username": "nonexistent",
            "password": "password123"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "Incorrect username or password" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_login_missing_credentials(self, client):
        """测试用户登录失败 - 缺少凭据"""
        response = await client.post("/api/v1/auth/login", json={})
        
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, client, test_user, auth_headers):
        """测试获取当前用户信息成功"""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["bio"] == test_user.bio
        assert data["timezone"] == test_user.timezone
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert data["is_online"] is False
        assert "created_at" in data
        assert "updated_at" in data
    
    @pytest.mark.asyncio
    async def test_get_current_user_without_token(self, client):
        """测试获取当前用户信息失败 - 无token"""
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client):
        """测试获取当前用户信息失败 - 无效token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "Could not validate credentials" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_get_current_user_malformed_token(self, client):
        """测试获取当前用户信息失败 - 格式错误的token"""
        headers = {"Authorization": "Bearer malformed.token.here"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "Could not validate credentials" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_logout_success(self, client, test_user, auth_headers):
        """测试用户登出成功"""
        response = await client.post("/api/v1/auth/logout", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"
    
    @pytest.mark.asyncio
    async def test_logout_without_token(self, client):
        """测试用户登出失败 - 无token"""
        response = await client.post("/api/v1/auth/logout")
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_logout_invalid_token(self, client):
        """测试用户登出失败 - 无效token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.post("/api/v1/auth/logout", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "Could not validate credentials" in data["detail"]


class TestAuthAPIEdgeCases:
    """认证API边界情况测试"""
    
    @pytest.mark.asyncio
    async def test_register_with_optional_fields(self, client):
        """测试用户注册只有必需字段"""
        user_data = {
            "username": "minimaluser",
            "email": "minimal@example.com",
            "full_name": "Minimal User",
            "password": "password123"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["bio"] is None
        assert data["timezone"] is None
        assert data["avatar_url"] is None
    
    @pytest.mark.asyncio
    async def test_register_with_empty_optional_fields(self, client):
        """测试用户注册可选字段为空"""
        user_data = {
            "username": "emptyuser",
            "email": "empty@example.com",
            "full_name": "Empty User",
            "password": "password123",
            "bio": "",
            "timezone": "",
            "avatar_url": ""
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        # 空字符串可能会被处理为None或保持为空字符串
        assert data["bio"] in [None, ""]
        assert data["timezone"] in [None, ""]
        assert data["avatar_url"] in [None, ""]
    
    @pytest.mark.asyncio
    async def test_login_case_sensitive_username(self, client, test_user):
        """测试用户登录用户名区分大小写"""
        login_data = {
            "username": "TESTUSER",  # 大写
            "password": "password123"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        # 用户名应该区分大小写
        assert response.status_code == 401
        data = response.json()
        assert "Incorrect username or password" in data["detail"]
    
    @pytest.mark.asyncio
    async def test_multiple_login_attempts(self, client, test_user):
        """测试多次登录尝试"""
        login_data = {
            "username": "testuser",
            "password": "password123"
        }
        
        # 多次成功登录
        for _ in range(3):
            response = await client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
    
    @pytest.mark.asyncio
    async def test_token_header_variations(self, client, test_user):
        """测试不同的token header格式"""
        from app.auth.auth import create_access_token
        
        token = create_access_token(data={"sub": test_user.username})
        
        # 正确格式
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        
        # 错误格式 - 缺少Bearer
        headers = {"Authorization": token}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 403
        
        # 错误格式 - 错误的scheme
        headers = {"Authorization": f"Basic {token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 403 