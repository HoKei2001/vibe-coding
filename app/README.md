# Huddle Up 后端

基于FastAPI的团队协作聊天应用后端服务。

## 🚀 功能特性

- ✅ 用户认证系统（注册、登录、JWT Token）
- ✅ 用户管理（CRUD操作、资料更新、在线状态）
- ✅ 完整的数据库模型（User、Team、Channel、Message等）
- ✅ 异步数据库操作（SQLAlchemy + AsyncPG）
- ✅ 数据库迁移（Alembic）
- ✅ API文档（自动生成）
- 🔄 团队管理（待实现）
- 🔄 频道管理（待实现）
- 🔄 消息系统（待实现）
- 🔄 WebSocket实时通信（待实现）

## 📦 技术栈

- **框架**: FastAPI
- **数据库**: PostgreSQL + SQLAlchemy (异步)
- **认证**: JWT + PassLib
- **迁移**: Alembic
- **验证**: Pydantic
- **密码加密**: bcrypt

## 🛠️ 本地开发

### 1. 环境准备

确保你已经安装了:
- Python 3.12+
- Poetry（用于依赖管理）
- PostgreSQL（或使用Docker）

### 2. 安装依赖

```bash
poetry install
```

### 3. 环境配置

项目使用 `config.ini` 文件进行配置，关键配置项：

```ini
[database]
host = postgres
port = 5432
name = local-db
user = local-user
password = local-password
schema = myschema

[service]
env = local
```

### 4. 数据库迁移

```bash
# 创建迁移文件
alembic revision --autogenerate -m "Initial migration"

# 应用迁移
alembic upgrade head
```

### 5. 启动开发服务器

```bash
# 使用uvicorn启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或者直接运行
python -m app.main
```

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t huddle-up-backend .
```

### 使用Docker Compose

```bash
docker-compose up -d
```

## 📚 API 文档

启动服务器后，可以访问：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔗 API 端点

### 认证
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户
- `POST /api/v1/auth/logout` - 用户登出

### 用户管理
- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/{user_id}` - 获取指定用户
- `PUT /api/v1/users/{user_id}` - 更新用户信息
- `DELETE /api/v1/users/{user_id}` - 删除用户
- `GET /api/v1/users/search` - 搜索用户

### 团队管理（待实现）
- `GET /api/v1/teams` - 获取团队列表
- `POST /api/v1/teams` - 创建团队

### 频道管理（待实现）
- `GET /api/v1/channels` - 获取频道列表
- `POST /api/v1/channels` - 创建频道

### 消息系统（待实现）
- `GET /api/v1/messages` - 获取消息列表
- `POST /api/v1/messages` - 发送消息

## 📁 项目结构

```
app/
├── api/                 # API路由
│   └── v1/
│       ├── auth.py      # 认证路由
│       ├── users.py     # 用户路由
│       ├── teams.py     # 团队路由
│       ├── channels.py  # 频道路由
│       └── messages.py  # 消息路由
├── auth/                # 认证模块
│   └── auth.py         # 认证逻辑
├── database/           # 数据库配置
│   └── database.py     # 数据库连接
├── models/             # 数据库模型
│   ├── user.py         # 用户模型
│   ├── team.py         # 团队模型
│   ├── channel.py      # 频道模型
│   └── message.py      # 消息模型
├── schemas/            # Pydantic模型
│   ├── auth.py         # 认证Schema
│   ├── user.py         # 用户Schema
│   ├── team.py         # 团队Schema
│   ├── channel.py      # 频道Schema
│   └── message.py      # 消息Schema
├── services/           # 业务逻辑
│   └── user_service.py # 用户服务
├── utils/              # 工具函数
│   └── config.py       # 配置管理
└── main.py            # 应用入口
```

## 🔧 下一步开发

1. **团队服务实现**
   - 创建 `app/services/team_service.py`
   - 实现团队CRUD操作
   - 完善团队API路由

2. **频道服务实现**
   - 创建 `app/services/channel_service.py`
   - 实现频道CRUD操作
   - 完善频道API路由

3. **消息服务实现**
   - 创建 `app/services/message_service.py`
   - 实现消息CRUD操作
   - 完善消息API路由

4. **WebSocket实时通信**
   - 实现WebSocket连接管理
   - 实现实时消息推送
   - 实现在线状态更新

5. **测试覆盖**
   - 单元测试
   - 集成测试
   - API测试

## 🧪 测试

```bash
# 运行测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app tests/
```

## 🔒 安全配置

生产环境需要配置：
- JWT密钥（环境变量）
- 数据库密码（环境变量）
- CORS允许的域名
- HTTPS配置

## �� 许可证

MIT License 