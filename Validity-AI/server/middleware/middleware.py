from fastapi import Request, HTTPException, status
import jwt
from jwt import PyJWTError

import os

passw = os.getenv("PASSW")
salt = os.getenv("SALT")
algorithm = os.getenv("ALGORITHM")
secret_key = os.getenv("SECRET_KEY")

async def auth_middleware(req: Request):
    # Example: Check for a JWT in cookies
    if not req.cookies:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing cookies"
        )
    token = req.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        # Proceed to API endpoint
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )