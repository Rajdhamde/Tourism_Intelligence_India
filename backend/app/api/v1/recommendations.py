import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from backend.app.ml.recommender import DestinationRecommender

router = APIRouter()

# In-memory recommendation cache for recent sessions
_SESSION_CACHE = {}

@router.post("", response_model=RecommendationResponse)
def get_recommendations(
    req: RecommendationRequest,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    recommender = DestinationRecommender(db)
    profile = {
        "nature_affinity": req.nature_affinity,
        "culture_affinity": req.culture_affinity,
        "adventure_affinity": req.adventure_affinity,
        "relaxation_affinity": req.relaxation_affinity,
        "wildlife_affinity": req.wildlife_affinity,
        "budget_tier": req.budget_tier,
        "duration_days": req.duration_days
    }

    result = recommender.recommend(
        profile=profile,
        target_month=req.target_month,
        region_filter=req.preferred_region,
        category_filter=req.preferred_category,
        state_filter=req.preferred_state,
        exclude_visited_ids=req.exclude_visited_ids,
        top_k=req.top_k
    )

    sid = session_id or f"rec_sess_{uuid.uuid4().hex[:12]}"
    _SESSION_CACHE[sid] = result

    return RecommendationResponse(**result)


@router.get("/{session_id}", response_model=RecommendationResponse)
def get_recommendations_by_session(session_id: str):
    if session_id not in _SESSION_CACHE:
        raise HTTPException(status_code=404, detail="Recommendation session not found or expired.")
    return RecommendationResponse(**_SESSION_CACHE[session_id])
