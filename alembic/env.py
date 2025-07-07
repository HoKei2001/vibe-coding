"""
Alembic 环境配置
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.database.database import Base
from app.models import *  # 导入所有模型
from app.utils.config import config as app_config

# 这是 Alembic Config 对象，它提供了对配置文件中值的访问
config = context.config

# 解释日志配置文件
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 添加模型的 MetaData 对象以支持 'autogenerate'
target_metadata = Base.metadata

# 其他来自 config 的值，由 env.py 的需求定义
# 可以在这里获取，比如：
# my_important_option = config.get_main_option("my_important_option")
# ... 等等


def run_migrations_offline() -> None:
    """以'离线'模式运行迁移。
    
    这将配置上下文仅使用 URL 而不是 Engine，
    尽管 Engine 也可以接受，但在这种情况下，
    我们不需要从中创建 Engine
    """
    url = app_config.database.url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """以'在线'模式运行迁移。
    
    在这种情况下，我们需要创建一个 Engine
    并将连接关联到上下文
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = app_config.database.url
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online() 