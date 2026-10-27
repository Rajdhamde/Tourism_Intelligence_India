from fastapi import APIRouter
from backend.app.api.v1 import (
    destinations,
    recommendations,
    analytics,
    ml,
    etl,
    interactions,
    assistant
)

api_router = APIRouter()

api_router.include_router(destinations.router, prefix="/destinations", tags=["Destinations"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Data Mining"])
api_router.include_router(ml.router, prefix="/ml", tags=["Machine Learning"])
api_router.include_router(etl.router, prefix="/etl", tags=["ETL & Data Warehouse"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["Interactions Telemetry"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["Agentic AI Assistant"])
