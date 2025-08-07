"""
fastapi provides API
api provides routers for each route
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api import (
    login_router,
)

from app.services.mysqldb import init_db_pool

origins = [
    "https://localhost:3000"
]

@asynccontextmanager
async def lifespan(_ls_app: FastAPI):
    """ Runs startup / cleanup code"""
    # Startup code
    await init_db_pool()
    yield
    # Shutdown code (optional cleanup)

app = FastAPI(title="ChatApp API", version="0.1.0", lifespan=lifespan)

app.include_router(login_router, tags=["login", "signup"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
