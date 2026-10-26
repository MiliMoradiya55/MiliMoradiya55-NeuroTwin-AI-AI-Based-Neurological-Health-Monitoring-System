# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.database import init_db
from app.api.v1.routes import auth, dashboard, timeline, voice, tremor, face, memory, typing_assessment, feedback, chat

app = FastAPI(
    title="NeuroTwin AI API",
    description="AI-Powered Digital Brain Twin",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS - Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⭐ IMPORTANT: Register timeline FIRST so its routes take priority
app.include_router(timeline.router, prefix="/api/v1", tags=["Timeline"])

# Then other routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(voice.router, prefix="/api/v1", tags=["Voice"])
app.include_router(tremor.router, prefix="/api/v1", tags=["Tremor"])
app.include_router(face.router, prefix="/api/v1", tags=["Face"])
app.include_router(memory.router, prefix="/api/v1", tags=["Memory"])
app.include_router(typing_assessment.router, prefix="/api/v1", tags=["Typing"])
app.include_router(feedback.router, prefix="/api/v1", tags=["Feedback"])
app.include_router(chat.router, prefix="/api/v1", tags=["AI Chat"])  # ✅ Added


@app.on_event("startup")
async def startup_event():
    init_db()
    print("🚀 NeuroTwin AI API is running!")

    # ===== DEBUG: Print all timeline routes =====
    print("=" * 70)
    print("📋 ALL TIMELINE ROUTES REGISTERED:")
    for route in app.routes:
        if hasattr(route, 'path') and '/timeline' in route.path:
            methods = ','.join(route.methods) if hasattr(route, 'methods') else 'N/A'
            print(f"   [{methods}] {route.path}")
    print("=" * 70)

    # ===== DEBUG: Print all dashboard routes =====
    print("📋 ALL DASHBOARD ROUTES REGISTERED:")
    for route in app.routes:
        if hasattr(route, 'path') and '/dashboard' in route.path:
            methods = ','.join(route.methods) if hasattr(route, 'methods') else 'N/A'
            print(f"   [{methods}] {route.path}")
    print("=" * 70)


@app.get("/")
async def root():
    return {
        "message": "Welcome to NeuroTwin AI API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }