from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db, haversine_distance_km
from backend.app.models.destination import Destination
from backend.app.schemas.destination import (
    DestinationBase,
    DestinationDetail,
    DestinationNearby,
    DestinationListResponse
)

router = APIRouter()

@router.get("", response_model=DestinationListResponse)
def list_destinations(
    query: Optional[str] = Query(None, description="Search query across name, description, tags, state"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    region: Optional[str] = Query(None, description="Filter by geographic region"),
    category: Optional[str] = Query(None, description="Filter by destination category"),
    budget_tier: Optional[str] = Query(None, description="Filter by budget tier (Budget, Moderate, Luxury)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    q = db.query(Destination)

    if query:
        pattern = f"%{query}%"
        q = q.filter(
            Destination.name.ilike(pattern)
            | Destination.state.ilike(pattern)
            | Destination.category.ilike(pattern)
            | Destination.short_description.ilike(pattern)
            | Destination.tags_json.ilike(pattern)
        )

    if state:
        q = q.filter(Destination.state == state)
    if region:
        q = q.filter(Destination.region == region)
    if category:
        q = q.filter(Destination.category == category)
    if budget_tier:
        q = q.filter(Destination.estimated_budget_tier.ilike(f"%{budget_tier}%"))

    total = q.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    items = q.order_by(Destination.popularity_score.desc()).offset((page - 1) * page_size).limit(page_size).all()

    response_items = []
    for d in items:
        response_items.append(
            DestinationBase(
                destination_id=d.destination_id,
                name=d.name,
                category=d.category,
                state=d.state,
                region=d.region,
                latitude=d.latitude,
                longitude=d.longitude,
                elevation_m=d.elevation_m,
                short_description=d.short_description,
                best_season=d.best_season,
                avg_visit_duration_days=d.avg_visit_duration_days,
                estimated_budget_tier=d.estimated_budget_tier,
                typical_spend_inr=d.typical_spend_inr,
                family_friendly=d.family_friendly,
                rating=d.rating,
                review_count=d.review_count,
                popularity_score=d.popularity_score,
                cover_image=d.cover_image
            )
        )

    return DestinationListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=response_items
    )


@router.get("/regions", response_model=List[str])
def get_regions(db: Session = Depends(get_db)):
    results = db.query(Destination.region).distinct().order_by(Destination.region).all()
    return [r[0] for r in results if r[0]]


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    results = db.query(Destination.category).distinct().order_by(Destination.category).all()
    return [c[0] for c in results if c[0]]


@router.get("/states", response_model=List[str])
def get_states(db: Session = Depends(get_db)):
    results = db.query(Destination.state).distinct().order_by(Destination.state).all()
    return [s[0] for s in results if s[0]]


@router.get("/{destination_id}", response_model=DestinationDetail)
def get_destination_detail(destination_id: str, db: Session = Depends(get_db)):
    dest = db.query(Destination).filter(Destination.destination_id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail=f"Destination '{destination_id}' not found.")

    return DestinationDetail(
        destination_id=dest.destination_id,
        name=dest.name,
        category=dest.category,
        state=dest.state,
        region=dest.region,
        latitude=dest.latitude,
        longitude=dest.longitude,
        elevation_m=dest.elevation_m,
        short_description=dest.short_description,
        detailed_description=dest.detailed_description,
        highlights=dest.highlights,
        tags=dest.tags,
        best_season=dest.best_season,
        best_months=dest.best_months,
        avg_visit_duration_days=dest.avg_visit_duration_days,
        estimated_budget_tier=dest.estimated_budget_tier,
        typical_spend_inr=dest.typical_spend_inr,
        family_friendly=dest.family_friendly,
        accessibility_rating=dest.accessibility_rating,
        rating=dest.rating,
        review_count=dest.review_count,
        popularity_score=dest.popularity_score,
        cover_image=dest.cover_image,
        gallery=dest.gallery,
        image_attribution=dest.image_attribution,
        image_license=dest.image_license,
        entry_fee_info=dest.entry_fee_info,
        opening_hours_info=dest.opening_hours_info,
        source_name=dest.source_name,
        source_url=dest.source_url,
        last_verified_date=dest.last_verified_date
    )


@router.get("/{destination_id}/images")
def get_destination_images(destination_id: str, db: Session = Depends(get_db)):
    dest = db.query(Destination).filter(Destination.destination_id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail=f"Destination '{destination_id}' not found.")
    
    images = [dest.cover_image]
    images.extend(dest.gallery)
    # Deduplicate while preserving order
    seen = set()
    unique_images = []
    for img in images:
        if img and img not in seen:
            seen.add(img)
            unique_images.append(img)

    return {
        "destination_id": dest.destination_id,
        "name": dest.name,
        "cover_image": dest.cover_image,
        "gallery": unique_images,
        "image_attribution": dest.image_attribution,
        "license": dest.image_license
    }


@router.get("/{destination_id}/nearby", response_model=List[DestinationNearby])
def get_nearby_destinations(
    destination_id: str,
    radius_km: float = Query(450.0, ge=10.0, le=2000.0),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    base_dest = db.query(Destination).filter(Destination.destination_id == destination_id).first()
    if not base_dest:
        raise HTTPException(status_code=404, detail=f"Destination '{destination_id}' not found.")

    candidates = db.query(Destination).filter(Destination.destination_id != destination_id).all()
    nearby = []

    for c in candidates:
        dist = haversine_distance_km(base_dest.latitude, base_dest.longitude, c.latitude, c.longitude)
        if dist <= radius_km:
            nearby.append(
                DestinationNearby(
                    destination_id=c.destination_id,
                    name=c.name,
                    category=c.category,
                    state=c.state,
                    distance_km=dist,
                    rating=c.rating,
                    short_description=c.short_description,
                    cover_image=c.cover_image,
                    latitude=c.latitude,
                    longitude=c.longitude
                )
            )

    nearby.sort(key=lambda x: x.distance_km)
    return nearby[:limit]
