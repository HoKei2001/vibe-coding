"""
配置测试
"""
import os
import tempfile
from pathlib import Path
from unittest.mock import patch, mock_open
import pytest

from app.utils.config import ConfigValue, _DatabaseConfig, _ServiceConfig, config, load_config


class TestConfigValue:
    """配置值测试"""
    
    def test_config_value_from_env(self, monkeypatch):
        """测试从环境变量获取配置值"""
        # 创建临时配置文件
        config_content = "[test]\nkey1 = ini_value\n"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.ini', delete=False) as f:
            f.write(config_content)
            f.flush()
            
            # 设置环境变量
            monkeypatch.setenv("TEST_KEY1", "env_value")
            
            # 模拟配置文件路径
            with patch('app.utils.config.Path') as mock_path:
                mock_path.return_value.exists.return_value = True
                with patch('builtins.open', mock_open(read_data=config_content)):
                    config_val = ConfigValue("test")
                    result = config_val.get_value("key1", str)
                    
                    # 环境变量应该优先于配置文件
                    assert result == "env_value"
    
    def test_config_value_from_ini(self, monkeypatch):
        """测试从INI文件获取配置值"""
        config_content = "[test]\nkey1 = ini_value\n"
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.ini', delete=False) as f:
            f.write(config_content)
            f.flush()
            
            # 确保环境变量不存在
            monkeypatch.delenv("TEST_KEY1", raising=False)
            
            with patch('app.utils.config.Path') as mock_path:
                mock_path.return_value.exists.return_value = True
                with patch('builtins.open', mock_open(read_data=config_content)):
                    config_val = ConfigValue("test")
                    result = config_val.get_value("key1", str)
                    
                    assert result == "ini_value"
    
    def test_config_value_type_casting(self, monkeypatch):
        """测试配置值类型转换"""
        monkeypatch.setenv("TEST_BOOL", "true")
        monkeypatch.setenv("TEST_INT", "42")
        monkeypatch.setenv("TEST_FLOAT", "3.14")
        monkeypatch.setenv("TEST_STR", "hello")
        
        config_content = "[test]\nbool_key = true\nint_key = 42\nfloat_key = 3.14\nstr_key = hello\n"
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                config_val = ConfigValue("test")
                
                # 测试布尔值转换
                assert config_val.get_value("bool_key", bool) is True
                
                # 测试整数转换
                assert config_val.get_value("int_key", int) == 42
                
                # 测试浮点数转换
                assert config_val.get_value("float_key", float) == 3.14
                
                # 测试字符串转换
                assert config_val.get_value("str_key", str) == "hello"
    
    def test_config_value_bool_variations(self, monkeypatch):
        """测试布尔值的不同表示"""
        test_cases = [
            ("true", True),
            ("True", True),
            ("TRUE", True),
            ("1", True),
            ("yes", True),
            ("YES", True),
            ("on", True),
            ("ON", True),
            ("false", False),
            ("False", False),
            ("FALSE", False),
            ("0", False),
            ("no", False),
            ("NO", False),
            ("off", False),
            ("OFF", False),
        ]
        
        config_content = "[test]\nkey = placeholder\n"
        
        for value, expected in test_cases:
            monkeypatch.setenv("TEST_KEY", value)
            
            with patch('app.utils.config.Path') as mock_path:
                mock_path.return_value.exists.return_value = True
                with patch('builtins.open', mock_open(read_data=config_content)):
                    config_val = ConfigValue("test")
                    result = config_val.get_value("key", bool)
                    
                    assert result == expected, f"Value '{value}' should be {expected}"
    
    def test_config_value_missing_file(self):
        """测试配置文件不存在"""
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = False
            
            with pytest.raises(FileNotFoundError):
                ConfigValue("test")
    
    def test_config_value_unsupported_type(self, monkeypatch):
        """测试不支持的类型转换"""
        monkeypatch.setenv("TEST_KEY", "value")
        
        config_content = "[test]\nkey = value\n"
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                config_val = ConfigValue("test")
                
                with pytest.raises(ValueError):
                    config_val.get_value("key", dict)  # 不支持的类型


class TestDatabaseConfig:
    """数据库配置测试"""
    
    def test_database_config_properties(self, monkeypatch):
        """测试数据库配置属性"""
        monkeypatch.setenv("DATABASE_HOST", "localhost")
        monkeypatch.setenv("DATABASE_PORT", "5432")
        monkeypatch.setenv("DATABASE_NAME", "testdb")
        monkeypatch.setenv("DATABASE_USER", "testuser")
        monkeypatch.setenv("DATABASE_PASSWORD", "testpass")
        monkeypatch.setenv("DATABASE_SCHEMA", "testschema")
        
        config_content = """[database]
host = localhost
port = 5432
name = testdb
user = testuser
password = testpass
schema = testschema
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                db_config = _DatabaseConfig()
                
                assert db_config.host == "localhost"
                assert db_config.port == 5432
                assert db_config.name == "testdb"
                assert db_config.user == "testuser"
                assert db_config.password == "testpass"
                assert db_config.schema == "testschema"
    
    def test_database_config_url(self, monkeypatch):
        """测试数据库URL生成"""
        monkeypatch.setenv("DATABASE_HOST", "localhost")
        monkeypatch.setenv("DATABASE_PORT", "5432")
        monkeypatch.setenv("DATABASE_NAME", "testdb")
        monkeypatch.setenv("DATABASE_USER", "testuser")
        monkeypatch.setenv("DATABASE_PASSWORD", "testpass")
        monkeypatch.setenv("DATABASE_SCHEMA", "testschema")
        
        config_content = """[database]
host = localhost
port = 5432
name = testdb
user = testuser
password = testpass
schema = testschema
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                db_config = _DatabaseConfig()
                
                expected_url = "postgresql://testuser:testpass@localhost:5432/testdb"
                assert db_config.url == expected_url
    
    def test_database_config_str(self, monkeypatch):
        """测试数据库配置字符串表示"""
        monkeypatch.setenv("DATABASE_HOST", "localhost")
        monkeypatch.setenv("DATABASE_PORT", "5432")
        monkeypatch.setenv("DATABASE_NAME", "testdb")
        monkeypatch.setenv("DATABASE_USER", "testuser")
        monkeypatch.setenv("DATABASE_PASSWORD", "testpass")
        monkeypatch.setenv("DATABASE_SCHEMA", "testschema")
        
        config_content = """[database]
host = localhost
port = 5432
name = testdb
user = testuser
password = testpass
schema = testschema
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                db_config = _DatabaseConfig()
                
                str_repr = str(db_config)
                assert "localhost" in str_repr
                assert "5432" in str_repr
                assert "testdb" in str_repr
                assert "testuser" in str_repr
                assert "testschema" in str_repr


class TestServiceConfig:
    """服务配置测试"""
    
    def test_service_config_env_prefix(self, monkeypatch):
        """测试服务配置不使用前缀"""
        monkeypatch.setenv("ENV", "production")
        
        config_content = """[service]
env = production
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                service_config = _ServiceConfig()
                
                assert service_config.env == "production"
    
    def test_service_config_str(self, monkeypatch):
        """测试服务配置字符串表示"""
        monkeypatch.setenv("ENV", "development")
        
        config_content = """[service]
env = development
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                service_config = _ServiceConfig()
                
                str_repr = str(service_config)
                assert "development" in str_repr


class TestLoadConfig:
    """加载配置测试"""
    
    def test_load_config_function(self, monkeypatch):
        """测试加载配置函数"""
        monkeypatch.setenv("ENV", "test")
        monkeypatch.setenv("DATABASE_HOST", "localhost")
        monkeypatch.setenv("DATABASE_PORT", "5432")
        monkeypatch.setenv("DATABASE_NAME", "testdb")
        monkeypatch.setenv("DATABASE_USER", "testuser")
        monkeypatch.setenv("DATABASE_PASSWORD", "testpass")
        monkeypatch.setenv("DATABASE_SCHEMA", "testschema")
        
        config_content = """[service]
env = test

[database]
host = localhost
port = 5432
name = testdb
user = testuser
password = testpass
schema = testschema
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                # 这应该不会抛出异常
                load_config()
    
    @pytest.mark.asyncio
    async def test_global_config_object(self, monkeypatch):
        """测试全局配置对象"""
        monkeypatch.setenv("ENV", "test")
        monkeypatch.setenv("DATABASE_HOST", "localhost")
        monkeypatch.setenv("DATABASE_PORT", "5432")
        monkeypatch.setenv("DATABASE_NAME", "testdb")
        monkeypatch.setenv("DATABASE_USER", "testuser")
        monkeypatch.setenv("DATABASE_PASSWORD", "testpass")
        monkeypatch.setenv("DATABASE_SCHEMA", "testschema")
        
        config_content = """[service]
env = test

[database]
host = localhost
port = 5432
name = testdb
user = testuser
password = testpass
schema = testschema
"""
        
        with patch('app.utils.config.Path') as mock_path:
            mock_path.return_value.exists.return_value = True
            with patch('builtins.open', mock_open(read_data=config_content)):
                # 测试全局配置对象的属性
                assert hasattr(config, 'service')
                assert hasattr(config, 'database')
                
                # 测试配置值
                assert config.service.env == "test"
                assert config.database.host == "localhost"
                assert config.database.port == 5432 