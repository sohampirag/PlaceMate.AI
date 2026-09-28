import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# TODO: Import routers once created
# from app.api import auth, resume, interview, report
# from app.voice.websocket_handler import router as websocket_router

app = FastAPI(title="PlaceMate.AI API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import resume, practice, jobs
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
from app.voice.websocket_handler import router as websocket_router
app.include_router(websocket_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PlaceMate.AI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
