from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    signal: list[float] = Field(..., min_length=2)


class PredictResponse(BaseModel):
    class_name: str = Field(alias="class")
    confidence: float

    model_config = {"populate_by_name": True}


class PingResponse(BaseModel):
    status: str
