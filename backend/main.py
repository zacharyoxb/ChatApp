"""
fastapi provides API
api provides routers for each route
"""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from backend.app.api import (
    auth_router,
    chat_router,
    user_router
)

origins = [
    "http://localhost:5173"
    "https://localhost:5173"
]

app = FastAPI(title="ChatApp API", version="0.1.0")

app.include_router(chat_router, tags=["chats"])
app.include_router(user_router, tags=["users"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
