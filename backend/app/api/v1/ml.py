import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.ml.clustering import TouristBehaviourMiner
from backend.app.models.warehouse import MLModelMetadata

router = APIRouter()

@router.post("/train")
def train_clustering_model(
    k_range: List[int] = Body([2, 3, 4, 5, 6, 7], description="Cluster count candidates to evaluate"),
    db: Session = Depends(get_db)
):
    """
    Executes K-Means training and hyperparameter search across k_range,
    evaluating Silhouette scores and inertia (Elbow method),
    and updates tourist segment assignments.
    """
    miner = TouristBehaviourMiner(db)
    try:
        results = miner.train_and_evaluate(k_range=k_range)
        return {
            "status": "SUCCESS",
            "message": "Tourist Behaviour Clustering model trained and evaluated successfully.",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/evaluation")
def get_model_evaluation(db: Session = Depends(get_db)):
    """
    Returns latest model evaluation results, including Elbow curve and Silhouette score.
    """
    latest = db.query(MLModelMetadata).order_by(MLModelMetadata.id.desc()).first()
    if not latest:
        # Train on demand if not yet trained
        miner = TouristBehaviourMiner(db)
        results = miner.train_and_evaluate()
        return results

    try:
        metrics = json.loads(latest.metrics_json)
        return metrics
    except Exception:
        miner = TouristBehaviourMiner(db)
        return miner.train_and_evaluate()


@router.post("/predict-cluster")
def predict_cluster(
    profile: Dict[str, Any] = Body(
        ...,
        example={
            "nature_affinity": 0.85,
            "culture_affinity": 0.25,
            "adventure_affinity": 0.80,
            "relaxation_affinity": 0.30,
            "wildlife_affinity": 0.60,
            "heritage_affinity": 0.30,
            "budget_tier": "moderate",
            "duration_days": 4.0
        }
    ),
    db: Session = Depends(get_db)
):
    """
    Inference endpoint: Predicts tourist segment and cluster label for a new profile.
    """
    miner = TouristBehaviourMiner(db)
    result = miner.predict_tourist_cluster(profile)
    return result
