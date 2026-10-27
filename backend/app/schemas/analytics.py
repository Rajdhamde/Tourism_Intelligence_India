from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class OverviewKPIs(BaseModel):
    total_destinations: int
    total_tracked_visits: int
    total_tourist_profiles: int
    total_interactions: int
    avg_tourist_satisfaction: float
    avg_estimated_spend_inr: float
    avg_trip_duration_days: float
    active_clusters_count: int
    data_source_label: str = "Star-Schema Tourism Data Warehouse (Academic Synthetic + Curated Records)"

class SeasonalityDataPoint(BaseModel):
    month_number: int
    month_name: str
    season: str
    total_visits: int
    avg_spend_inr: float
    popular_category: str

class ClusterAnalyticsItem(BaseModel):
    cluster_id: int
    cluster_label: str
    member_count: int
    member_percentage: float
    avg_spend_inr: float
    avg_duration_days: float
    feature_profile: Dict[str, float]
    preferred_categories: List[str]
    description: str

class CategoryDistributionItem(BaseModel):
    category: str
    destination_count: int
    total_visits: int
    avg_rating: float

class StateDistributionItem(BaseModel):
    state: str
    region: str
    destination_count: int
    total_visits: int
    capital: Optional[str] = None
