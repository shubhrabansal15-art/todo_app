import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.tasks import router as tasks_router

load_dotenv()

app = FastAPI()

# CORS: allow local dev by default, plus any comma-separated origins in FRONTEND_URL
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
_allowed_origins = [origin.strip() for origin in _frontend_url.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(tasks_router)


@app.get("/")
def root():
    return {"message": "Todo API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}