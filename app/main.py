from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.chat import router as chat_router
from .core.app import create_app

# app = FastAPI(title="PRL User LLM Experiment API")

# Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3001"],  # Frontend URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Include routers
# app.include_router(chat_router, prefix="/api")

app = create_app()

if __name__ == "__main__":
    import uvicorn
    # app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=3000) 