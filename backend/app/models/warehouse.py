import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.destination import Destination

class DimTourist(Base):
    __tablename__ = "dim_tourists"

    tourist_key = Column(Integer, primary_key=True, autoincrement=True, index=True)
    tourist_id = Column(String(64), unique=True, nullable=False, index=True)
    origin_country = Column(String(64), default="India")
    origin_state = Column(String(64), default="Maharashtra")
    age_group = Column(String(32), default="25-34")
    travel_party_type = Column(String(32), default="Couple")  # Solo, Couple, Family, Group
    
    # Feature preferences (0.0 to 1.0)
    nature_affinity = Column(Float, default=0.5)
    culture_affinity = Column(Float, default=0.5)
    adventure_affinity = Column(Float, default=0.5)
    relaxation_affinity = Column(Float, default=0.5)
    wildlife_affinity = Column(Float, default=0.5)
    heritage_affinity = Column(Float, default=0.5)
    
    preferred_budget_tier = Column(String(32), default="Moderate")  # Budget, Moderate, Luxury
    avg_spend_per_trip = Column(Float, default=15000.0)
    trip_duration_preference_days = Column(Float, default=3.0)
    
    assigned_cluster = Column(Integer, default=-1, index=True)
    cluster_label = Column(String(64), default="Unsegmented")
    created_at = Column(DateTime, default=datetime.utcnow)

    visits = relationship("FactTourismVisit", back_populates="tourist")
    interactions = relationship("FactDestinationInteraction", back_populates="tourist")


class DimDate(Base):
    __tablename__ = "dim_dates"

    date_key = Column(Integer, primary_key=True)  # e.g. 20261015
    full_date = Column(String(10), nullable=False, unique=True, index=True)  # YYYY-MM-DD
    day = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False, index=True)
    month_name = Column(String(16), nullable=False)
    quarter = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False, index=True)
    season = Column(String(32), nullable=False, index=True)  # Winter, Summer, Monsoon, Post-Monsoon
    is_weekend = Column(Boolean, default=False)

    visits = relationship("FactTourismVisit", back_populates="date_dim")


class DimTrip(Base):
    __tablename__ = "dim_trips"

    trip_key = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String(64), unique=True, nullable=False)
    purpose = Column(String(64), default="Leisure")  # Leisure, Adventure, Pilgrimage, Eco-tourism, Wellness
    budget_band = Column(String(32), default="Mid")   # Low, Mid, Premium
    duration_band = Column(String(32), default="Medium") # Short (1-2), Medium (3-5), Long (6+)
    travel_party = Column(String(32), default="Couple")
    transport_preference = Column(String(32), default="Train")

    visits = relationship("FactTourismVisit", back_populates="trip_dim")


class DimGeography(Base):
    __tablename__ = "dim_geographies"

    geography_key = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String(64), unique=True, nullable=False, index=True)
    region = Column(String(64), nullable=False, index=True)  # Northern, Southern, Himalayan, etc.
    zone = Column(String(64), default="India")
    capital = Column(String(64), default="")
    primary_language = Column(String(64), default="Hindi")
    terrain_type = Column(String(64), default="Mixed")


class FactTourismVisit(Base):
    __tablename__ = "fact_tourism_visits"

    visit_id = Column(Integer, primary_key=True, autoincrement=True)
    tourist_key = Column(Integer, ForeignKey("dim_tourists.tourist_key"), nullable=False, index=True)
    destination_key = Column(Integer, ForeignKey("dim_destinations.destination_key"), nullable=False, index=True)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False, index=True)
    trip_key = Column(Integer, ForeignKey("dim_trips.trip_key"), nullable=False, index=True)
    
    visit_duration_days = Column(Float, nullable=False, default=2.0)
    estimated_spend_inr = Column(Float, nullable=False, default=8000.0)
    satisfaction_score = Column(Float, nullable=False, default=4.5)  # 1.0 to 5.0
    travel_party_size = Column(Integer, nullable=False, default=2)
    visit_count = Column(Integer, default=1)
    is_synthetic = Column(Boolean, default=True)  # Clearly labels benchmark/synthetic data

    tourist = relationship("DimTourist", back_populates="visits")
    destination = relationship("Destination")
    date_dim = relationship("DimDate", back_populates="visits")
    trip_dim = relationship("DimTrip", back_populates="visits")

    __table_args__ = (
        Index("idx_fact_visit_tourist_dest", "tourist_key", "destination_key"),
        Index("idx_fact_visit_date_dest", "date_key", "destination_key"),
    )


class FactDestinationInteraction(Base):
    __tablename__ = "fact_destination_interactions"

    interaction_id = Column(Integer, primary_key=True, autoincrement=True)
    tourist_key = Column(Integer, ForeignKey("dim_tourists.tourist_key"), nullable=True, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    destination_key = Column(Integer, ForeignKey("dim_destinations.destination_key"), nullable=False, index=True)
    date_key = Column(Integer, ForeignKey("dim_dates.date_key"), nullable=False, index=True)
    
    interaction_type = Column(String(32), nullable=False, index=True)  # view, click, search, save, 3d_explore
    dwell_time_seconds = Column(Float, default=10.0)
    source_channel = Column(String(64), default="web_3d_explorer")
    created_at = Column(DateTime, default=datetime.utcnow)

    tourist = relationship("DimTourist", back_populates="interactions")
    destination = relationship("Destination")


class ETLLog(Base):
    __tablename__ = "etl_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(64), nullable=False, unique=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    records_extracted = Column(Integer, default=0)
    records_cleaned = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    status = Column(String(32), default="RUNNING")  # SUCCESS, FAILED, RUNNING
    quality_report_json = Column(Text, default="{}")
    error_message = Column(Text, nullable=True)


class MLModelMetadata(Base):
    __tablename__ = "ml_model_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(64), nullable=False, index=True)
    algorithm = Column(String(64), default="KMeans")
    n_clusters = Column(Integer, default=5)
    silhouette_score = Column(Float, default=0.0)
    inertia = Column(Float, default=0.0)
    trained_at = Column(DateTime, default=datetime.utcnow)
    metrics_json = Column(Text, default="{}")
    cluster_definitions_json = Column(Text, default="{}")
    is_active = Column(Boolean, default=True)
