import sys
import logging
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_root))

from backend.app.db.session import engine, SessionLocal
from backend.app.db.base import Base
from backend.app.etl.pipeline import TourismETLPipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_db")

def main():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    db = SessionLocal()
    try:
        logger.info("Starting Tourism ETL Pipeline...")
        pipeline = TourismETLPipeline(db=db)
        report = pipeline.run()
        logger.info("ETL Pipeline finished successfully!")
        logger.info("Summary Quality Report:")
        for k, v in report.items():
            if k != "validation_errors":
                logger.info("  %s: %s", k, v)
        if report["validation_errors"]:
            logger.warning("  Validation errors logged: %d", len(report["validation_errors"]))
    finally:
        db.close()

if __name__ == "__main__":
    main()
