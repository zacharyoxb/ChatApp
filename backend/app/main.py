"""
fastapi provides API
api provides routers for each route
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api import (
    login_router,
    session_router,
    chats_router,
    user_router,
)

from app.services.myredis import redis_service
from app.services.mysqldb import db_service
from app.utils.service_configs import config_manager

origins = [
    "https://localhost:3000"
]


@asynccontextmanager
async def lifespan(_ls_app: FastAPI):
    """ Runs startup / cleanup code"""
    # Startup code
    config_manager.initialize()
    db_config = config_manager.get_db_config()
    redis_config = config_manager.get_redis_config()

    await db_service.init_db_pool(db_config)
    redis_service.init_redis(redis_config)

    yield
    # Shutdown code (optional cleanup)

app = FastAPI(title="ChatApp API", version="0.1.0", lifespan=lifespan)

app.include_router(login_router, tags=["login", "signup"])
app.include_router(session_router, tags=["session", "auth"])
app.include_router(chats_router, tags=["chat", "group"])
app.include_router(user_router, tags=["user", "member"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
