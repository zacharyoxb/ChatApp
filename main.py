"""
fastapi provides API
api provides routers for each route
"""

from fastapi import FastAPI

from api import (
    auth_router,
    chat_router,
    user_router
)

app = FastAPI(title="ChatApp API", version="0.1.0")

app.include_router(chat_router, tags=["chats"])
app.include_router(user_router, tags=["users"])

app.include_router(auth_router, prefix="/auth", tags=["auth"])

@app.get("/")
def root():
    """
    Stand in for root
    """
    return {"message": "Hello world"}
