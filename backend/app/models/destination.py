import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Index
from backend.app.db.session import Base

class Destination(Base):
    __tablename__ = "dim_destinations"

    destination_key = Column(Integer, primary_key=True, autoincrement=True, index=True)
    destination_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False, index=True)
    category = Column(String(64), nullable=False, index=True)
    state = Column(String(64), nullable=False, index=True)
    region = Column(String(64), nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    elevation_m = Column(Float, default=0.0)
    
    short_description = Column(String(256), nullable=False)
    detailed_description = Column(Text, nullable=False)
    
    highlights_json = Column(Text, default="[]")
    tags_json = Column(Text, default="[]")
    
    best_season = Column(String(64), default="October to March")
    best_months_json = Column(Text, default="[]")
    
    avg_visit_duration_days = Column(Float, default=2.0)
    estimated_budget_tier = Column(String(32), default="Moderate", index=True)
    typical_spend_inr = Column(Float, default=5000.0)
    
    family_friendly = Column(Boolean, default=True)
    accessibility_rating = Column(Float, default=3.5)
    rating = Column(Float, default=4.5, index=True)
    review_count = Column(Integer, default=120)
    popularity_score = Column(Float, default=80.0)
    
    cover_image = Column(String(512), nullable=False)
    gallery_json = Column(Text, default="[]")
    
    image_attribution = Column(String(256), default="Wikimedia Commons / Creative Commons")
    image_license = Column(String(64), default="CC BY-SA 4.0")
    
    entry_fee_info = Column(String(256), default="Information verified from local tourism board")
    opening_hours_info = Column(String(256), default="Open all days, sunrise to sunset")
    source_name = Column(String(128), default="Ministry of Tourism & OpenStreetMap")
    source_url = Column(String(512), default="https://tourism.gov.in")
    last_verified_date = Column(String(32), default="2026-03-15")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_dest_coords", "latitude", "longitude"),
        Index("idx_dest_cat_state", "category", "state"),
    )

    @property
    def highlights(self):
        try:
            return json.loads(self.highlights_json)
        except Exception:
            return []

    @property
    def tags(self):
        try:
            return json.loads(self.tags_json)
        except Exception:
            return []

    @property
    def gallery(self):
        try:
            return json.loads(self.gallery_json)
        except Exception:
            return []

    @property
    def best_months(self):
        try:
            return json.loads(self.best_months_json)
        except Exception:
            return []
