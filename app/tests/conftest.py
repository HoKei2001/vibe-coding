"""
pytest配置文件和测试固定装置
"""
import asyncio
import tempfile
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.database.database import Base, get_db
from app.main import app
from app.models.user import User


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环用于测试"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """创建测试数据库会话"""
    # 使用内存SQLite数据库进行测试
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    AsyncTestSession = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )
    
    async with AsyncTestSession() as session:
        yield session
        await session.rollback()
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """创建测试客户端"""
    app.dependency_overrides[get_db] = lambda: test_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # 清理覆盖
    app.dependency_overrides = {}


@pytest.fixture(scope="function")
def sync_client(test_db: AsyncSession) -> Generator[TestClient, None, None]:
    """创建同步测试客户端"""
    app.dependency_overrides[get_db] = lambda: test_db
    
    with TestClient(app) as client:
        yield client
    
    # 清理覆盖
    app.dependency_overrides = {}


@pytest.fixture
async def test_user(test_db: AsyncSession) -> User:
    """创建测试用户"""
    from app.services.user_service import UserService
    from app.schemas.user import UserCreate
    
    user_service = UserService(test_db)
    user_create = UserCreate(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        password="password123",
        bio="Test bio",
        timezone="UTC"
    )
    
    user = await user_service.create_user(user_create)
    return user


@pytest.fixture
async def test_user_2(test_db: AsyncSession) -> User:
    """创建第二个测试用户"""
    from app.services.user_service import UserService
    from app.schemas.user import UserCreate
    
    user_service = UserService(test_db)
    user_create = UserCreate(
        username="testuser2",
        email="test2@example.com",
        full_name="Test User 2",
        password="password123",
        bio="Test bio 2",
        timezone="UTC"
    )
    
    user = await user_service.create_user(user_create)
    return user


@pytest.fixture
def mock_config():
    """模拟配置"""
    mock_config = MagicMock()
    mock_config.service.env = "test"
    mock_config.database.url = "sqlite+aiosqlite:///:memory:"
    mock_config.database.schema = "test_schema"
    return mock_config


@pytest.fixture
def test_token(test_user: User) -> str:
    """生成测试JWT Token"""
    from app.auth.auth import create_access_token
    
    token = create_access_token(data={"sub": test_user.username})
    return token


@pytest.fixture
def auth_headers(test_token: str) -> dict:
    """生成认证请求头"""
    return {"Authorization": f"Bearer {test_token}"}


@pytest.fixture
def mock_password_hash():
    """模拟密码哈希"""
    with pytest.MonkeyPatch.context() as m:
        m.setattr("app.utils.password.get_password_hash", lambda x: f"hashed_{x}")
        m.setattr("app.utils.password.verify_password", lambda plain, hashed: f"hashed_{plain}" == hashed)
        yield


@pytest.fixture
def sample_user_data():
    """示例用户数据"""
    return {
        "username": "newuser",
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "password123",
        "bio": "New user bio",
        "timezone": "UTC"
    }


@pytest.fixture
def sample_user_update_data():
    """示例用户更新数据"""
    return {
        "full_name": "Updated User",
        "bio": "Updated bio",
        "timezone": "America/New_York"
    }


@pytest.fixture
def sample_login_data():
    """示例登录数据"""
    return {
        "username": "testuser",
        "password": "password123"
    }


# 异步测试配置
pytest_asyncio.fixture(scope="session")
async def async_session_fixture():
    """异步会话固定装置"""
    pass


@pytest.fixture(autouse=True)
def setup_test_env(monkeypatch):
    """设置测试环境"""
    # 设置测试环境变量
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    
    # 模拟配置文件
    import tempfile
    import os
    
    config_content = """
[service]
env = test

[database]
host = localhost
port = 5432
name = test_db
user = test_user
password = test_password
schema = test_schema
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.ini', delete=False) as f:
        f.write(config_content)
        f.flush()
        monkeypatch.setattr("app.utils.config.Path", lambda x: type('MockPath', (), {'exists': lambda: True})())
        monkeypatch.setattr("app.utils.config.ConfigParser.read", lambda self, path: self.read_string(config_content)) 