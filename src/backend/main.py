import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model import load_artifacts
from routers import router

ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", "/app/ml/artifacts"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model, app.state.scaler, app.state.meta = load_artifacts(ARTIFACTS_DIR)
    yield
    del app.state.model, app.state.scaler, app.state.meta


def create_app() -> FastAPI:
    app = FastAPI(
        title="BeatSense API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    app.include_router(router)

    return app


app = create_app()
