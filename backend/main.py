import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.tasks import router as tasks_router
from routes.projects import router as projects_router
from routes.reminders import router as reminders_router

load_dotenv()

app = FastAPI(title="Taskflow API")

# CORS: allow local dev by default, plus any comma-separated origins in FRONTEND_URL
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
_allowed_origins = [origin.strip() for origin in _frontend_url.split(",") if origin.strip()]

# Always include localhost for local development
if "http://localhost:5173" not in _allowed_origins:
    _allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(projects_router)
app.include_router(reminders_router)


@app.get("/")
def root():
    return {"message": "Taskflow API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}