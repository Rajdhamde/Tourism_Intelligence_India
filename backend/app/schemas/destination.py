from typing import List, Optional
from pydantic import BaseModel, Field

class DestinationBase(BaseModel):
    destination_id: str
    name: str
    category: str
    state: str
    region: str
    latitude: float
    longitude: float
    elevation_m: float = 0.0
    short_description: str
    best_season: str
    avg_visit_duration_days: float = 2.0
    estimated_budget_tier: str = "Moderate"
    typical_spend_inr: float = 5000.0
    family_friendly: bool = True
    rating: float = 4.5
    review_count: int = 100
    popularity_score: float = 85.0
    cover_image: str

class DestinationDetail(DestinationBase):
    detailed_description: str
    highlights: List[str] = []
    tags: List[str] = []
    best_months: List[str] = []
    accessibility_rating: float = 3.5
    gallery: List[str] = []
    image_attribution: str = ""
    image_license: str = ""
    entry_fee_info: str = ""
    opening_hours_info: str = ""
    source_name: str = ""
    source_url: str = ""
    last_verified_date: str = ""

class DestinationNearby(BaseModel):
    destination_id: str
    name: str
    category: str
    state: str
    distance_km: float
    rating: float
    short_description: str
    cover_image: str
    latitude: float
    longitude: float

class DestinationListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[DestinationBase]
