from fastapi import APIRouter, Response, Request, HTTPException, status
from fastapi.responses import PlainTextResponse
# pip install fastapi pyjwt
import jwt
from datetime import datetime, timedelta

import hashlib

from dotenv import load_dotenv
load_dotenv()

import os

passw = os.getenv("PASSW")
salt = os.getenv("SALT")

if passw is None or salt is None:
    raise RuntimeError("PASSW or SALT not set in environment!")

# Ensure passw and salt are in bytes
passw_bytes = bytes.fromhex(passw)
salt_bytes = bytes.fromhex(salt)

algorithm = os.getenv("ALGORITHM")
secret_key = os.getenv("SECRET_KEY")

auth_router = APIRouter()

@auth_router.post("/login", response_class=PlainTextResponse)
async def login(req: Request, res: Response):
    try:
        data = await req.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or missing JSON body"
        )
    if "passw" not in data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )
    req_passw = data["passw"]
    hashed_passw = hashlib.pbkdf2_hmac('sha256', req_passw.encode('utf-8'), salt_bytes, 100000)
    if hashed_passw != passw_bytes:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    payload = {
        "sub": os.urandom(16).hex(),
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, secret_key, algorithm=algorithm)
    res.set_cookie(key="access_token", value=token, httponly=True)
    return "Login successful"