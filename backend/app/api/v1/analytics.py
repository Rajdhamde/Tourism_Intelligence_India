import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.models.destination import Destination
from backend.app.models.warehouse import (
    DimTourist,
    DimDate,
    DimGeography,
    FactTourismVisit,
    FactDestinationInteraction,
    MLModelMetadata
)
from backend.app.schemas.analytics import (
    OverviewKPIs,
    SeasonalityDataPoint,
    ClusterAnalyticsItem,
    CategoryDistributionItem,
    StateDistributionItem
)

router = APIRouter()

@router.get("/overview", response_model=OverviewKPIs)
def get_analytics_overview(db: Session = Depends(get_db)):
    total_dests = db.query(func.count(Destination.destination_key)).scalar() or 0
    total_tourists = db.query(func.count(DimTourist.tourist_key)).scalar() or 0
    total_visits = db.query(func.count(FactTourismVisit.visit_id)).scalar() or 0
    total_interactions = db.query(func.count(FactDestinationInteraction.interaction_id)).scalar() or 0

    stats = db.query(
        func.avg(FactTourismVisit.satisfaction_score),
        func.avg(FactTourismVisit.estimated_spend_inr),
        func.avg(FactTourismVisit.visit_duration_days)
    ).first()

    avg_sat = round(float(stats[0] or 4.5), 2)
    avg_spend = round(float(stats[1] or 8500.0), 2)
    avg_dur = round(float(stats[2] or 2.5), 1)

    active_clusters = db.query(func.count(func.distinct(DimTourist.assigned_cluster))).filter(
        DimTourist.assigned_cluster >= 0
    ).scalar() or 5

    return OverviewKPIs(
        total_destinations=total_dests,
        total_tracked_visits=total_visits,
        total_tourist_profiles=total_tourists,
        total_interactions=total_interactions,
        avg_tourist_satisfaction=avg_sat,
        avg_estimated_spend_inr=avg_spend,
        avg_trip_duration_days=avg_dur,
        active_clusters_count=active_clusters,
        data_source_label="Star-Schema Tourism Data Warehouse (Academic Benchmark + Curated Records)"
    )


@router.get("/seasonality", response_model=List[SeasonalityDataPoint])
def get_seasonality_analytics(
    year: Optional[int] = Query(None, description="Optional filter by calendar year (e.g. 2025)"),
    db: Session = Depends(get_db)
):
    # Query visits joined with DimDate grouped by month
    q = db.query(
        DimDate.month,
        DimDate.month_name,
        DimDate.season,
        func.count(FactTourismVisit.visit_id).label("total_visits"),
        func.avg(FactTourismVisit.estimated_spend_inr).label("avg_spend")
    ).join(FactTourismVisit, FactTourismVisit.date_key == DimDate.date_key)

    if year:
        q = q.filter(DimDate.year == year)

    results = q.group_by(DimDate.month, DimDate.month_name, DimDate.season).order_by(DimDate.month).all()

    season_category_hints = {
        "Winter": "Heritage & Desert Exploration",
        "Summer": "Himalayan Hill Stations & Treks",
        "Monsoon": "Waterfalls & Highland Rain Forests",
        "Post-Monsoon": "Wildlife Reserves & National Parks"
    }

    data_points = []
    for row in results:
        data_points.append(
            SeasonalityDataPoint(
                month_number=row.month,
                month_name=row.month_name,
                season=row.season,
                total_visits=int(row.total_visits),
                avg_spend_inr=round(float(row.avg_spend or 8000.0), 2),
                popular_category=season_category_hints.get(row.season, "Cultural Heritage")
            )
        )
    return data_points


@router.get("/clusters", response_model=List[ClusterAnalyticsItem])
def get_cluster_analytics(db: Session = Depends(get_db)):
    latest_model = db.query(MLModelMetadata).order_by(MLModelMetadata.id.desc()).first()
    if latest_model and latest_model.cluster_definitions_json:
        try:
            summaries = json.loads(latest_model.cluster_definitions_json)
            return [ClusterAnalyticsItem(**s) for s in summaries]
        except Exception:
            pass

    # Fallback to direct aggregation from DimTourist
    clusters = db.query(
        DimTourist.assigned_cluster,
        DimTourist.cluster_label,
        func.count(DimTourist.tourist_key).label("member_count"),
        func.avg(DimTourist.avg_spend_per_trip).label("avg_spend"),
        func.avg(DimTourist.trip_duration_preference_days).label("avg_duration"),
        func.avg(DimTourist.nature_affinity).label("avg_nat"),
        func.avg(DimTourist.culture_affinity).label("avg_cul"),
        func.avg(DimTourist.adventure_affinity).label("avg_adv"),
        func.avg(DimTourist.relaxation_affinity).label("avg_rel")
    ).group_by(DimTourist.assigned_cluster, DimTourist.cluster_label).all()

    total_tourists = sum(r.member_count for r in clusters) or 1
    items = []
    for r in clusters:
        items.append(
            ClusterAnalyticsItem(
                cluster_id=r.assigned_cluster,
                cluster_label=r.cluster_label or f"Segment {r.assigned_cluster}",
                member_count=r.member_count,
                member_percentage=round((r.member_count / total_tourists) * 100, 1),
                avg_spend_inr=round(float(r.avg_spend or 10000.0), 2),
                avg_duration_days=round(float(r.avg_duration or 3.0), 1),
                feature_profile={
                    "nature": round(float(r.avg_nat or 0.5), 2),
                    "culture": round(float(r.avg_cul or 0.5), 2),
                    "adventure": round(float(r.avg_adv or 0.5), 2),
                    "relaxation": round(float(r.avg_rel or 0.5), 2)
                },
                preferred_categories=["Heritage & Monuments", "Mountains & Trekking"],
                description=f"Empirical tourist segment: {r.cluster_label}."
            )
        )
    return items


@router.get("/destinations", response_model=List[CategoryDistributionItem])
def get_destination_category_analytics(db: Session = Depends(get_db)):
    categories = db.query(
        Destination.category,
        func.count(Destination.destination_key).label("destination_count"),
        func.avg(Destination.rating).label("avg_rating")
    ).group_by(Destination.category).all()

    visits_by_cat = db.query(
        Destination.category,
        func.count(FactTourismVisit.visit_id).label("visit_count")
    ).join(FactTourismVisit, FactTourismVisit.destination_key == Destination.destination_key).group_by(Destination.category).all()
    visits_map = {row.category: row.visit_count for row in visits_by_cat}

    results = []
    for c in categories:
        results.append(
            CategoryDistributionItem(
                category=c.category,
                destination_count=c.destination_count,
                total_visits=visits_map.get(c.category, 0),
                avg_rating=round(float(c.avg_rating or 4.5), 2)
            )
        )
    results.sort(key=lambda x: x.total_visits, reverse=True)
    return results


@router.get("/states", response_model=List[StateDistributionItem])
def get_state_analytics(db: Session = Depends(get_db)):
    states = db.query(
        Destination.state,
        Destination.region,
        func.count(Destination.destination_key).label("dest_count")
    ).group_by(Destination.state, Destination.region).all()

    visits_by_state = db.query(
        Destination.state,
        func.count(FactTourismVisit.visit_id).label("visit_count")
    ).join(FactTourismVisit, FactTourismVisit.destination_key == Destination.destination_key).group_by(Destination.state).all()
    visits_map = {row.state: row.visit_count for row in visits_by_state}

    geos = {g.state: g.capital for g in db.query(DimGeography).all()}

    results = []
    for s in states:
        results.append(
            StateDistributionItem(
                state=s.state,
                region=s.region,
                destination_count=s.dest_count,
                total_visits=visits_map.get(s.state, 0),
                capital=geos.get(s.state, "")
            )
        )
    results.sort(key=lambda x: x.total_visits, reverse=True)
    return results
