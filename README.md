# Huddle Up

一个现代化的团队协作聊天应用，基于 Slack 灵感设计，使用 Python FastAPI 后端和 React TypeScript 前端。

## ✨ 主要特性

- 🏢 **团队管理** - 创建团队并邀请成员
- 📺 **频道组织** - 将对话组织到专门的频道中
- 💬 **实时消息** - 基于 WebSocket 的即时通讯
- 🎨 **现代UI** - 响应式设计，支持深色/浅色主题
- 🔐 **安全认证** - JWT 身份验证系统

## 🛠️ 技术栈

### 后端
- **FastAPI** - Python Web 框架
- **SQLAlchemy** - ORM 数据库操作
- **PostgreSQL** - 主数据库
- **WebSocket** - 实时通信
- **JWT** - 身份验证

### 前端
- **React** - UI 组件库
- **TypeScript** - 类型安全的 JavaScript
- **Redux Toolkit** - 状态管理
- **Tailwind CSS** - 样式框架
- **Socket.io** - 实时通信客户端

## 🚀 快速开始

### 开发环境
```bash
# 1. 克隆项目
git clone <repository-url>
cd huddle-up

# 2. 使用 DevContainer (推荐)
# 用 VS Code 打开项目，按 F1 选择 "Dev Containers: Open Folder in Container"

# 3. 启动后端
cd app
poetry install
poetry run uvicorn main:app --reload --host 0.0.0.0

# 4. 启动前端
cd frontend
npm install
npm run dev
```

### 访问应用
- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 📚 文档

完整的项目文档请查看 [docs](./docs/) 目录：

- **[开发指南](./docs/development/GUIDELINES.md)** - 开发规范和最佳实践
- **[功能清单](./docs/development/CHECKLIST.md)** - 项目完成情况
- **[功能演示](./docs/demos/)** - 各功能模块的详细演示
- **[项目概述](./docs/project/huddle-up.md)** - 项目详细信息

## 🏗️ 项目结构

```
huddle-up/
├── app/                    # FastAPI 后端应用
├── frontend/               # React 前端应用
├── docs/                   # 项目文档
│   ├── development/        # 开发相关文档
│   ├── demos/             # 功能演示文档
│   └── project/           # 项目信息文档
├── .devcontainer/         # DevContainer 配置
├── alembic/               # 数据库迁移
└── pyproject.toml         # Python 项目配置
```

## 🔧 开发环境

本项目使用 DevContainer 提供一致的开发环境，包含：
- Python 3.12 + Poetry
- Node.js 18 + npm
- PostgreSQL 客户端
- 预配置的 VS Code 扩展

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

---

💡 **提示**: 查看 [文档目录](./docs/) 获取完整的开发和部署指南。