from fastapi import APIRouter, Response, Request
from fastapi.responses import PlainTextResponse
# pip install fastapi pyjwt
import jwt
from datetime import datetime, timedelta

import hashlib

import os

passw = os.getenv("PASSW")
salt = os.getenv("SALT")
algorithm = os.getenv("ALGORITHM")
secret_key = os.getenv("SECRET_KEY")

auth_router = APIRouter()

@auth_router.post("/login", response_class=PlainTextResponse)
async def login(req: Request, res: Response):
    # Verify user credentials
    hashed_passw = hashlib.pbkdf2_hmac('sha256', req.passw.encode('utf-8'), salt, 100000) 

    # Generate a JWT token for verified user
    payload = {
        "sub": str(req.json.get("id")),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    res.set_cookie(key="access_token", value=token, httponly=True)
    return