"""
认证系统测试
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from app.auth.auth import (
    create_access_token,
    authenticate_user,
    get_current_user,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.models.user import User
from app.schemas.auth import TokenData


class TestJWTToken:
    """JWT Token相关测试"""
    
    def test_create_access_token(self):
        """测试创建访问令牌"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # 验证token包含正确的数据
        from jose import jwt
        from app.auth.auth import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert "exp" in payload
    
    def test_create_access_token_with_expires_delta(self):
        """测试创建带有过期时间的访问令牌"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)
        
        from jose import jwt
        from app.auth.auth import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 验证过期时间
        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + expires_delta
        
        # 允许1分钟的误差
        assert abs((exp_time - expected_exp).total_seconds()) < 60
    
    def test_create_access_token_default_expiration(self):
        """测试默认过期时间"""
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        from jose import jwt
        from app.auth.auth import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 允许1分钟的误差
        assert abs((exp_time - expected_exp).total_seconds()) < 60


class TestAuthentication:
    """用户认证测试"""
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, test_db, test_user):
        """测试用户认证成功"""
        user = await authenticate_user(test_db, "testuser", "password123")
        
        assert user is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, test_db, test_user):
        """测试用户认证失败 - 错误密码"""
        user = await authenticate_user(test_db, "testuser", "wrongpassword")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_authenticate_user_nonexistent_user(self, test_db):
        """测试用户认证失败 - 用户不存在"""
        user = await authenticate_user(test_db, "nonexistent", "password123")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, test_db, test_user):
        """测试获取当前用户成功"""
        from fastapi.security import HTTPAuthorizationCredentials
        
        # 创建有效的token
        token = create_access_token(data={"sub": test_user.username})
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        current_user = await get_current_user(credentials, test_db)
        
        assert current_user is not None
        assert current_user.username == test_user.username
        assert current_user.email == test_user.email
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, test_db):
        """测试获取当前用户失败 - 无效token"""
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid_token"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials, test_db)
        
        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_current_user_expired_token(self, test_db, test_user):
        """测试获取当前用户失败 - 过期token"""
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException
        
        # 创建过期的token
        expired_token = create_access_token(
            data={"sub": test_user.username},
            expires_delta=timedelta(minutes=-1)  # 过期1分钟
        )
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=expired_token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials, test_db)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user_nonexistent_user(self, test_db):
        """测试获取当前用户失败 - 用户不存在"""
        from fastapi.security import HTTPAuthorizationCredentials
        from fastapi import HTTPException
        
        # 创建不存在用户的token
        token = create_access_token(data={"sub": "nonexistent_user"})
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(credentials, test_db)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_active_user_success(self, test_db, test_user):
        """测试获取当前活跃用户成功"""
        current_active_user = await get_current_active_user(test_user)
        
        assert current_active_user == test_user
    
    @pytest.mark.asyncio
    async def test_get_current_active_user_inactive(self, test_db, test_user):
        """测试获取当前活跃用户失败 - 用户未激活"""
        from fastapi import HTTPException
        
        # 设置用户为非活跃状态
        test_user.is_active = False
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_active_user(test_user)
        
        assert exc_info.value.status_code == 400
        assert "Inactive user" in str(exc_info.value.detail)


class TestTokenValidation:
    """Token验证测试"""
    
    def test_token_data_creation(self):
        """测试TokenData创建"""
        token_data = TokenData(username="testuser", user_id=1)
        
        assert token_data.username == "testuser"
        assert token_data.user_id == 1
    
    def test_token_data_optional_fields(self):
        """测试TokenData可选字段"""
        token_data = TokenData()
        
        assert token_data.username is None
        assert token_data.user_id is None
    
    def test_malformed_token(self):
        """测试格式错误的token"""
        from jose import jwt, JWTError
        from app.auth.auth import SECRET_KEY, ALGORITHM
        
        with pytest.raises(JWTError):
            jwt.decode("malformed.token", SECRET_KEY, algorithms=[ALGORITHM])
    
    def test_token_without_sub(self):
        """测试没有sub字段的token"""
        from jose import jwt
        from app.auth.auth import SECRET_KEY, ALGORITHM
        
        # 创建没有sub字段的token
        token = jwt.encode({"exp": datetime.utcnow() + timedelta(minutes=30)}, SECRET_KEY, algorithm=ALGORITHM)
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload.get("sub") is None 