from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ..api.chat import router as chat_router
from ..core.config import FRONTEND_URL


def create_app() -> FastAPI:
    app = FastAPI(title="PRL User LLM Experiment API")

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_URL],  # Frontend URL from config
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(chat_router, prefix="/api")

    return app 