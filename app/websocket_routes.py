"""
独立的WebSocket路由
避免与API v1的循环导入问题
"""
import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.services.websocket_manager import connection_manager
from app.auth.dependencies import verify_websocket_token

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """WebSocket 连接端点"""
    user_id = None
    
    try:
        # 验证 token 并获取用户信息
        current_user = await verify_websocket_token(token, db)
        if not current_user:
            await websocket.close(code=1008, reason="Invalid token")
            return

        user_id = current_user.id
        
        # 接受连接
        await websocket.accept()
        logger.info(f"用户 {user_id} WebSocket连接已接受")
        
        # 将用户信息添加到连接管理器（全局连接）
        await connection_manager.connect(websocket, user_id)
        
        # 缓存用户信息
        connection_manager.user_info_cache[user_id] = {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "email": current_user.email
        }
        
        logger.info(f"用户 {user_id} 已连接 WebSocket")
        
        try:
            while True:
                # 接收消息
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    await connection_manager.handle_message(user_id, message)
                except json.JSONDecodeError:
                    logger.error(f"无法解析消息: {data}")
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "data": {"message": "Invalid JSON format"},
                        "timestamp": "2025-07-07T12:00:00Z"
                    }))
                except Exception as e:
                    logger.error(f"处理消息失败: {e}")
                    await websocket.send_text(json.dumps({
                        "type": "error", 
                        "data": {"message": "Message processing failed"},
                        "timestamp": "2025-07-07T12:00:00Z"
                    }))
                    
        except WebSocketDisconnect:
            logger.info(f"用户 {user_id} 断开了 WebSocket 连接")
            
    except WebSocketDisconnect:
        if user_id:
            logger.info(f"用户 {user_id} 在认证阶段断开连接")
    except Exception as e:
        logger.error(f"WebSocket 连接错误: {e}")
        try:
            if not websocket.client_state.disconnected:
                await websocket.close(code=1011, reason="Internal server error")
        except:
            pass  # 忽略关闭时的错误
        
    finally:
        # 清理连接
        if user_id:
            try:
                await connection_manager.disconnect(user_id)
                logger.info(f"用户 {user_id} 连接已清理")
            except Exception as e:
                logger.error(f"清理连接失败: {e}")
        
        # 关闭数据库会话
        try:
            await db.close()
        except Exception as e:
            logger.error(f"关闭数据库会话失败: {e}") 