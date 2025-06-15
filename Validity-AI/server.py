from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from auth import auth_router
from api import api_router

app = FastAPI()

@app.get("/", response_class=PlainTextResponse)
async def index():
    return "Hello from index!"

# Mount auth sub-router
app.include_router(auth_router, prefix="/auth")

# Mount api sub-router
app.include_router(api_router, prefix="/api")

# Only needed when running directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
