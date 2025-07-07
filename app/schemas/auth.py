"""
认证相关的Pydantic schemas
"""
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    """访问令牌响应"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """令牌数据"""
    username: Optional[str] = None
    user_id: Optional[int] = None 