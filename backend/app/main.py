from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import os
import uvicorn

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.services.face_service import face_service
from app.api import auth, users, faces, recognition, attendance, voice, system, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=============================================")
    print("  FaceVoice AI Platform Starting up...")
    print("=============================================")
    await init_db()
    async with AsyncSessionLocal() as db:
        await face_service.reload_cache(db)
    print("  Database & AI Cache Initialized!")
    print("  API Docs: http://localhost:8000/docs")
    print("  Platform Web App: http://localhost:8000")
    print("=============================================")
    yield
    print("  FaceVoice AI Platform shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Real-time Face Recognition + AI Voice Platform (Competition & Production Ready)",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for face crops and audio files
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(faces.router, prefix=settings.API_V1_STR)
app.include_router(recognition.router, prefix=settings.API_V1_STR)
app.include_router(attendance.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router, prefix=settings.API_V1_STR)

# Mount Frontend Dist if available
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("storage/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_candidate = frontend_dist / full_path
        if file_candidate.is_file():
            return FileResponse(file_candidate)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "message": "FaceVoice AI Platform API is running",
            "docs": "/docs",
            "status": "online",
            "version": settings.VERSION
        }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)