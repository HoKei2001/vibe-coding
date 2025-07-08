# 测试文档

本目录包含Huddle Up后端应用的所有测试文件。

## 测试结构

```
app/tests/
├── conftest.py                # pytest配置和测试固定装置
├── test_auth.py              # 认证系统测试
├── test_user_service.py      # 用户服务测试
├── test_api_auth.py          # 认证API测试
├── test_api_users.py         # 用户API测试
├── test_models.py            # 数据库模型测试
├── test_config.py            # 配置系统测试
├── api/
│   └── v1/
│       └── (未来的API版本测试)
└── README.md                 # 本文档
```

## 测试类型

### 1. 单元测试
- **认证系统测试** (`test_auth.py`)
  - JWT Token创建和验证
  - 用户认证逻辑
  - Token数据处理

- **用户服务测试** (`test_user_service.py`)
  - 用户CRUD操作
  - 用户搜索功能
  - 用户状态管理

- **配置系统测试** (`test_config.py`)
  - 配置值获取
  - 环境变量处理
  - 数据库配置

### 2. 集成测试
- **API测试** (`test_api_auth.py`, `test_api_users.py`)
  - 认证API端点
  - 用户管理API端点
  - 请求/响应验证

- **数据库模型测试** (`test_models.py`)
  - 模型创建和关系
  - 数据约束验证
  - 关系映射测试

## 测试固定装置 (Fixtures)

### 数据库固定装置
- `test_db`: 提供测试数据库会话（内存SQLite）
- `test_user`: 创建测试用户
- `test_user_2`: 创建第二个测试用户

### 认证固定装置
- `test_token`: 生成JWT测试令牌
- `auth_headers`: 提供认证请求头

### 客户端固定装置
- `client`: 异步HTTP客户端（推荐）
- `sync_client`: 同步HTTP客户端

### 数据固定装置
- `sample_user_data`: 示例用户数据
- `sample_user_update_data`: 示例用户更新数据
- `sample_login_data`: 示例登录数据

## 运行测试

### 1. 运行所有测试
```bash
pytest
```

### 2. 运行特定测试文件
```bash
pytest app/tests/test_auth.py
pytest app/tests/test_user_service.py
pytest app/tests/test_api_auth.py
```

### 3. 运行特定测试类
```bash
pytest app/tests/test_auth.py::TestJWTToken
pytest app/tests/test_user_service.py::TestUserService
```

### 4. 运行特定测试方法
```bash
pytest app/tests/test_auth.py::TestJWTToken::test_create_access_token
pytest app/tests/test_user_service.py::TestUserService::test_create_user_success
```

### 5. 使用标记运行测试
```bash
pytest -m unit          # 运行单元测试
pytest -m integration   # 运行集成测试
pytest -m auth          # 运行认证相关测试
pytest -m api           # 运行API测试
pytest -m models        # 运行模型测试
pytest -m services      # 运行服务测试
pytest -m config        # 运行配置测试
```

### 6. 生成测试覆盖率报告
```bash
pytest --cov=app --cov-report=html
pytest --cov=app --cov-report=term-missing
```

### 7. 并行运行测试
```bash
pytest -n auto          # 自动检测CPU核心数
pytest -n 4             # 使用4个进程
```

### 8. 详细输出
```bash
pytest -v               # 详细输出
pytest -vv              # 更详细的输出
pytest -s               # 显示print输出
```

## 测试环境设置

测试使用以下环境配置：

1. **数据库**: 内存SQLite数据库（每个测试独立）
2. **认证**: 模拟JWT Token和密码哈希
3. **配置**: 模拟配置文件和环境变量
4. **HTTP客户端**: FastAPI TestClient和httpx AsyncClient

## 编写新测试

### 1. 测试文件命名
- 文件名以 `test_` 开头
- 测试类名以 `Test` 开头
- 测试方法名以 `test_` 开头

### 2. 使用异步测试
```python
@pytest.mark.asyncio
async def test_async_function(self, test_db):
    # 异步测试代码
    pass
```

### 3. 使用固定装置
```python
async def test_with_fixtures(self, client, test_user, auth_headers):
    response = await client.get("/api/v1/users", headers=auth_headers)
    assert response.status_code == 200
```

### 4. 参数化测试
```python
@pytest.mark.parametrize("input,expected", [
    ("true", True),
    ("false", False),
    ("1", True),
    ("0", False),
])
def test_boolean_conversion(self, input, expected):
    assert convert_to_bool(input) == expected
```

### 5. 测试异常
```python
def test_exception_handling(self):
    with pytest.raises(ValueError, match="Invalid input"):
        some_function("invalid_input")
```

## 测试数据管理

### 1. 使用工厂函数
```python
def create_test_user(username="testuser", email="test@example.com"):
    return UserCreate(
        username=username,
        email=email,
        full_name="Test User",
        password="password123"
    )
```

### 2. 使用固定装置
```python
@pytest.fixture
def complex_test_data():
    return {
        "users": [create_test_user(), create_test_user("user2")],
        "teams": [create_test_team()],
        "channels": [create_test_channel()]
    }
```

## 最佳实践

1. **独立性**: 每个测试应该独立运行，不依赖其他测试
2. **清晰性**: 测试名称应该清楚描述测试的目的
3. **完整性**: 测试应该覆盖正常流程和异常情况
4. **性能**: 使用内存数据库和模拟外部依赖
5. **维护性**: 使用固定装置和工厂函数减少代码重复

## 持续集成

测试可以在CI/CD流水线中运行：

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov
      - name: Run tests
        run: pytest --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## 故障排除

### 1. 数据库连接问题
- 确保测试使用内存SQLite数据库
- 检查数据库模型导入是否正确

### 2. 异步测试问题
- 使用 `@pytest.mark.asyncio` 装饰器
- 确保pytest-asyncio插件已安装

### 3. 固定装置问题
- 检查固定装置的作用域（function, class, module, session）
- 确保固定装置依赖顺序正确

### 4. 导入问题
- 确保Python路径包含项目根目录
- 检查__init__.py文件是否存在

## 扩展测试

未来可以添加的测试类型：

1. **团队服务测试**
2. **频道服务测试**
3. **消息服务测试**
4. **WebSocket测试**
5. **通知服务测试**
6. **性能测试**
7. **负载测试**
8. **安全测试** 