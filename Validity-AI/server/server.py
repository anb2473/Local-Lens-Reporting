from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from routes.auth.auth import auth_router
from routes.api.api import api_router

from dotenv import load_dotenv
load_dotenv()

import os

port = int(os.getenv("PORT", 8000))

app = FastAPI()

# Mount auth sub-router
app.include_router(auth_router, prefix="/auth")

# Mount api sub-router
app.include_router(api_router, prefix="/api")

# Only needed when running directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port) # must be 0.0.0.0 to allow the port to be accessible from outside the docker
