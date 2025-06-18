"""
Provides routers from all api files for all routes
"""

from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.chats import router as chat_router
from backend.app.api.routes.users import router as user_router

__all__ = [
    "auth_router",
    "chat_router",
    "user_router"
]
