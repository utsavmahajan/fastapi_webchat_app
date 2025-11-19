from fastapi import FastAPI
from . import models
from .database import engine
from .routers import post, user, auth, vote
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Create Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Configuration
# Even though we are on the same port, we keep this for development flexibility
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(post.router)
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(vote.router)

# --- STATIC FILE SERVING ---
# This mounts the 'static' folder to the root URL '/'.
# html=True means it will serve 'index.html' automatically when visiting '/'

# Determine the path to the 'static' directory relative to this file
# Structure should be:
# app/
#   ├── main.py
#   └── static/
#       ├── index.html
#       ├── style.css
#       └── app.js

BASE_DIR = Path(__file__).resolve().parent
static_path = BASE_DIR / "static"

# IMPORTANT: We mount this LAST so it doesn't override API routes
# Check if directory exists to prevent errors during startup if folder is missing
if static_path.exists():
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
else:
    print(f"WARNING: Static folder not found at {static_path}. Frontend will not be served.")