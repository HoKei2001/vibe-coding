"""
Huddle Up 后端主应用入口
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.websocket_routes import router as websocket_router
from app.database.database import init_db
from app.utils.config import config, load_config


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    load_config()
    await init_db()
    yield
    # 关闭时执行
    pass


# 创建FastAPI应用
app = FastAPI(
    title="Huddle Up API",
    description="基于Slack灵感的团队协作聊天应用API",
    version="0.1.0",
    lifespan=lifespan,
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该配置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含API路由
app.include_router(api_router, prefix="/api/v1")

# 包含WebSocket路由
app.include_router(websocket_router)


@app.get("/")
async def root():
    """根路径健康检查"""
    return {"message": "Huddle Up API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "environment": config.service.env,
        "version": "0.1.0"
    }


# 全局异常处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if config.service.env == "local" else False,
        log_level="info"
    ) 