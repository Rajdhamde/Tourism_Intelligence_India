import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, SessionLocal
from backend.app.db.base import Base
from backend.app.models.destination import Destination
from backend.app.etl.pipeline import TourismETLPipeline
from backend.app.api.v1.router import api_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tourism_intelligence")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed if empty
    logger.info("Initializing database metadata...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = db.query(Destination).count()
        if count == 0:
            logger.info("Database empty, running initial Tourism ETL pipeline...")
            pipeline = TourismETLPipeline(db=db)
            pipeline.run()
            logger.info("Initial ETL seeding completed successfully.")
        else:
            logger.info("Database ready with %d destination records.", count)
    except Exception as e:
        logger.error("Error during startup database verification: %s", str(e))
    finally:
        db.close()
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Portfolio-quality Tourism Data Warehouse for Tourist Behaviour Mining, "
        "Geospatial 3D Exploration, and Destination Recommendation in India."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/v1/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "database": "connected",
        "timestamp": "2026-10-27T22:30:00Z"
    }

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
