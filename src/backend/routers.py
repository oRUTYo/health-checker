from fastapi import APIRouter, Request

from model import run_inference
from schemas import PingResponse, PredictRequest, PredictResponse

router = APIRouter()


@router.get("/ping", response_model=PingResponse, tags=["health"])
async def ping() -> PingResponse:
    return PingResponse(status="ok")


@router.post("/predict", response_model=PredictResponse, tags=["ml"])
async def predict(body: PredictRequest, request: Request) -> PredictResponse:
    result = run_inference(
        signal=body.signal,
        model=request.app.state.model,
        scaler=request.app.state.scaler,
        meta=request.app.state.meta,
    )
    return PredictResponse(class_name=result["class"], confidence=result["confidence"])
