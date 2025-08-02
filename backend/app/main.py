"""
fastapi provides API
api provides routers for each route
"""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api import (
    login_router,
)

origins = [
    "https://localhost:3000"
]

app = FastAPI(title="ChatApp API", version="0.1.0")

app.include_router(login_router, tags=["login", "signup"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
