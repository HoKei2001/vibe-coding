import os
from configparser import ConfigParser
from functools import cached_property
from pathlib import Path
from typing import TypeVar, cast

from pydantic import PostgresDsn

T = TypeVar("T", str, bool, int, float)


class ConfigValue:
    def __init__(self, section: str, use_section_prefix: bool = True):
        self._section = section
        self._use_section_prefix = use_section_prefix
        self._config = ConfigParser()

        # Load the INI file if it exists
        config_path = "config.ini"
        if Path(config_path).exists():
            self._config.read(config_path)
        else:
            raise FileNotFoundError(f"Config file not found: {config_path}")

    def get_value(self, key: str, value_type: type[T]) -> T:
        """
        Get a configuration value with the following precedence:
        1. Environment variable (SECTION_KEY if use_section_prefix is True, otherwise just KEY)
        2. INI file value
        """
        # First check environment variable
        env_key = f"{self._section.upper()}_{key.upper()}" if self._use_section_prefix else key.upper()
        env_value = os.environ.get(env_key)

        if env_value is not None:
            return self._cast_value(env_value, value_type)

        # Fallback to INI file
        value = self._config.get(self._section, key)
        os.environ[env_key] = value
        return self._cast_value(value, value_type)

    def _cast_value(self, value: str, value_type: type[T]) -> T:
        """Cast the string value to the specified type"""
        if value_type == bool:
            result = value.lower() in ("true", "1", "yes", "on")
            return cast(T, result)
        if value_type == int:
            return cast(T, int(value))
        if value_type == float:
            return cast(T, float(value))
        if value_type == str:
            return cast(T, value)
        raise ValueError(f"Unsupported type: {value_type}")


class _LLMConfig(ConfigValue):
    def __init__(self) -> None:
        super().__init__("llm")

    @cached_property
    def endpoint(self) -> str:
        return self.get_value("endpoint", str)

    @cached_property
    def model(self) -> str:
        return self.get_value("model", str)

    @cached_property
    def api_key(self) -> str:
        return self.get_value("api_key", str)

    def __str__(self) -> str:
        return f"Endpoint: {self.endpoint} Model: {self.model} API Key: {self.api_key}"


class _KnowledgeServerConfig(ConfigValue):
    def __init__(self) -> None:
        super().__init__("knowledge_server")

    @cached_property
    def host(self) -> str:
        return self.get_value("host", str)

    @cached_property
    def port(self) -> int:
        return self.get_value("port", int)

    def __str__(self) -> str:
        return f"Host: {self.host} Port: {self.port}"


class _MinioConfig(ConfigValue):
    def __init__(self) -> None:
        super().__init__("minio")

    @cached_property
    def endpoint(self) -> str:
        return self.get_value("endpoint", str)

    @cached_property
    def access_key(self) -> str:
        return self.get_value("access_key", str)

    @cached_property
    def secret_key(self) -> str:
        return self.get_value("secret_key", str)

    @cached_property
    def bucket(self) -> str:
        return self.get_value("bucket", str)


class _ServiceConfig(ConfigValue):
    def __init__(self) -> None:
        # For service config, we don't want to prefix env vars with SERVICE_
        super().__init__("service", use_section_prefix=False)

    @cached_property
    def env(self) -> str:
        return self.get_value("env", str)

    def __str__(self) -> str:
        return f"Env: {self.env}"


class _DatabaseConfig(ConfigValue):
    def __init__(self) -> None:
        super().__init__("database")

    @cached_property
    def host(self) -> str:
        return self.get_value("host", str)

    @cached_property
    def port(self) -> int:
        return self.get_value("port", int)

    @cached_property
    def name(self) -> str:
        return self.get_value("name", str)

    @cached_property
    def user(self) -> str:
        return self.get_value("user", str)

    @cached_property
    def password(self) -> str:
        return self.get_value("password", str)

    @cached_property
    def schema(self) -> str:
        return self.get_value("schema", str)

    @cached_property
    def url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

    def __str__(self) -> str:
        return f"Host: {self.host} Port: {self.port} DB: {self.name} User: {self.user} Schema: {self.schema}"


class _Config:
    service = _ServiceConfig()
    llm = _LLMConfig()
    minio = _MinioConfig()
    knowledge_server = _KnowledgeServerConfig()
    database = _DatabaseConfig()

    def __str__(self) -> str:
        return f"Loaded config: LLM: {self.llm} Minio: {self.minio} Knowledge Server: {self.knowledge_server} Database: {self.database} Service: {self.service}"


config = _Config()


def load_config() -> None:
    # Go through all the config values once so the cached properties are populated
    with open(os.devnull, "w", encoding="utf-8") as devnull:
        print(config, file=devnull)


__all__ = ["config", "load_config"]