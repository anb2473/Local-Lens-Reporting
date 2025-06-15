from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

api_router = APIRouter()

@auth_router.get("/status", response_class=PlainTextResponse)
async def auth_status():
    return "Auth module is up!"
