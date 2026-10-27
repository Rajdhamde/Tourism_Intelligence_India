import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.etl.pipeline import TourismETLPipeline
from backend.app.models.warehouse import ETLLog

router = APIRouter()

@router.post("/run")
def trigger_etl_pipeline(db: Session = Depends(get_db)):
    """
    Triggers the ETL workflow:
    Extract -> Validate -> Clean -> Transform -> Load -> Evaluate
    """
    pipeline = TourismETLPipeline(db=db)
    try:
        report = pipeline.run()
        return {
            "status": "SUCCESS",
            "message": "ETL Pipeline completed successfully.",
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ETL Execution Failed: {str(e)}")


@router.get("/status")
def get_etl_status(limit: int = 5, db: Session = Depends(get_db)):
    """
    Retrieves latest ETL execution audit logs and data quality reports.
    """
    logs = db.query(ETLLog).order_by(ETLLog.id.desc()).limit(limit).all()
    results = []
    for l in logs:
        q_report = {}
        if l.quality_report_json:
            try:
                q_report = json.loads(l.quality_report_json)
            except Exception:
                pass
        results.append({
            "id": l.id,
            "batch_id": l.batch_id,
            "started_at": l.started_at.isoformat() if l.started_at else None,
            "completed_at": l.completed_at.isoformat() if l.completed_at else None,
            "records_extracted": l.records_extracted,
            "records_cleaned": l.records_cleaned,
            "records_loaded": l.records_loaded,
            "status": l.status,
            "error_message": l.error_message,
            "quality_report": q_report
        })
    return results
