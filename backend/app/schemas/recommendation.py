from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RecommendationRequest(BaseModel):
    nature_affinity: float = Field(0.5, ge=0.0, le=1.0)
    culture_affinity: float = Field(0.5, ge=0.0, le=1.0)
    adventure_affinity: float = Field(0.5, ge=0.0, le=1.0)
    relaxation_affinity: float = Field(0.5, ge=0.0, le=1.0)
    wildlife_affinity: float = Field(0.5, ge=0.0, le=1.0)
    budget_tier: str = Field("Moderate", description="Budget, Moderate, Luxury")
    duration_days: float = Field(3.0, ge=1.0, le=15.0)
    target_month: Optional[str] = None
    preferred_region: Optional[str] = None
    preferred_category: Optional[str] = None
    preferred_state: Optional[str] = None
    exclude_visited_ids: Optional[List[str]] = []
    top_k: int = Field(6, ge=1, le=20)

class RecommendedItem(BaseModel):
    destination_id: str
    name: str
    category: str
    state: str
    region: str
    latitude: float
    longitude: float
    elevation_m: float
    short_description: str
    cover_image: str
    rating: float
    estimated_budget_tier: str
    typical_spend_inr: float
    avg_visit_duration_days: float
    best_season: str
    highlights: List[str]
    tags: List[str]
    recommendation_score: float
    component_scores: Dict[str, float]
    matched_interests: List[str]
    evidence_rationale: str
    source_attribution: str

class RecommendationResponse(BaseModel):
    predicted_tourist_cluster: int
    cluster_label: str
    target_travel_month: str
    total_candidates_evaluated: int
    recommendations: List[RecommendedItem]
    model_weights: Dict[str, float]
