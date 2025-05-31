from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.core.config import FRONTEND_URL

# Initialize FastAPI app
app = FastAPI(
    title="PRL User LLM Experiment API",
    description="Backend API for the PRL User LLM Experiment",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Frontend URL from config
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint that redirects to the API documentation."""
    return {"message": "Welcome to the PRL User LLM Experiment API. Visit /docs for the API documentation."}
