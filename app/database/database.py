"""
数据库连接和会话管理
"""
import logging
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.utils.config import config

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """SQLAlchemy基类"""
    pass


# 同步数据库引擎（用于Alembic迁移）
sync_engine = create_engine(
    config.database.url,
    echo=True if config.service.env == "local" else False,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    connect_args={"options": f"-csearch_path={config.database.schema}"}
)

# 异步数据库引擎（用于FastAPI应用）
async_engine = create_async_engine(
    config.database.url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=True if config.service.env == "local" else False,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    connect_args={"server_settings": {"search_path": config.database.schema}}
)

# 会话工厂
SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """获取数据库会话依赖项"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """初始化数据库"""
    try:
        # 测试数据库连接
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """关闭数据库连接"""
    await async_engine.dispose()
    logger.info("Database connections closed") 