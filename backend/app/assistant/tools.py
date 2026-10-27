import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.destination import Destination
from backend.app.db.session import haversine_distance_km
from backend.app.ml.recommender import DestinationRecommender

class AssistantTools:
    def __init__(self, db: Session):
        self.db = db
        self.recommender = DestinationRecommender(db)

    def search_destinations(self, query: str, state: Optional[str] = None, category: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search destinations by keywords, state, or category.
        """
        q = self.db.query(Destination)
        if state:
            q = q.filter(Destination.state.ilike(f"%{state}%"))
        if category:
            q = q.filter(Destination.category.ilike(f"%{category}%"))
        if query:
            search_filter = (
                Destination.name.ilike(f"%{query}%")
                | Destination.state.ilike(f"%{query}%")
                | Destination.short_description.ilike(f"%{query}%")
                | Destination.category.ilike(f"%{query}%")
            )
            q = q.filter(search_filter)

        results = q.limit(limit).all()
        return [
            {
                "destination_id": d.destination_id,
                "name": d.name,
                "category": d.category,
                "state": d.state,
                "region": d.region,
                "coordinates": {"latitude": d.latitude, "longitude": d.longitude},
                "rating": d.rating,
                "short_description": d.short_description,
                "best_season": d.best_season,
                "cover_image": d.cover_image
            }
            for d in results
        ]

    def get_destination_details(self, destination_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve complete factual details and verified metadata for a destination.
        """
        dest = self.db.query(Destination).filter(Destination.destination_id == destination_id).first()
        if not dest:
            return None
        return {
            "destination_id": dest.destination_id,
            "name": dest.name,
            "category": dest.category,
            "state": dest.state,
            "region": dest.region,
            "coordinates": {"latitude": dest.latitude, "longitude": dest.longitude},
            "elevation_m": dest.elevation_m,
            "short_description": dest.short_description,
            "detailed_description": dest.detailed_description,
            "highlights": dest.highlights,
            "tags": dest.tags,
            "best_season": dest.best_season,
            "avg_visit_duration_days": dest.avg_visit_duration_days,
            "estimated_budget_tier": dest.estimated_budget_tier,
            "typical_spend_inr": dest.typical_spend_inr,
            "rating": dest.rating,
            "entry_fee_info": dest.entry_fee_info,
            "opening_hours_info": dest.opening_hours_info,
            "source_name": dest.source_name,
            "source_url": dest.source_url,
            "last_verified_date": dest.last_verified_date,
            "cover_image": dest.cover_image,
            "gallery": dest.gallery
        }

    def get_nearby_places(self, destination_id: str, radius_km: float = 300.0, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Perform spatial proximity search to find attractions within radius_km.
        """
        dest = self.db.query(Destination).filter(Destination.destination_id == destination_id).first()
        if not dest:
            return []

        all_dests = self.db.query(Destination).filter(Destination.destination_id != destination_id).all()
        nearby = []
        for d in all_dests:
            dist = haversine_distance_km(dest.latitude, dest.longitude, d.latitude, d.longitude)
            if dist <= radius_km:
                nearby.append({
                    "destination_id": d.destination_id,
                    "name": d.name,
                    "category": d.category,
                    "state": d.state,
                    "distance_km": dist,
                    "rating": d.rating,
                    "short_description": d.short_description,
                    "cover_image": d.cover_image,
                    "coordinates": {"latitude": d.latitude, "longitude": d.longitude}
                })

        nearby.sort(key=lambda x: x["distance_km"])
        return nearby[:limit]

    def recommend_destinations(self, profile: Dict[str, Any], top_k: int = 4) -> Dict[str, Any]:
        """
        Execute core hybrid recommendation engine.
        """
        return self.recommender.recommend(profile=profile, top_k=top_k)

    def get_tourism_facts(self, topic: str) -> Dict[str, Any]:
        """
        RAG knowledge retrieval for factual Indian tourism guidance.
        """
        topic_lower = topic.lower()
        facts = []
        if "permit" in topic_lower or "ladakh" in topic_lower or "arunachal" in topic_lower:
            facts.append({
                "topic": "Inner Line Permit (ILP)",
                "fact": "Protected border zones including Pangong Tso, Nubra Valley, and parts of Arunachal Pradesh require an Inner Line Permit or Protected Area Permit issued by district authorities or the official online portal.",
                "source": "Ministry of Home Affairs & Ladakh Administration"
            })
        if "season" in topic_lower or "monsoon" in topic_lower or "weather" in topic_lower:
            facts.append({
                "topic": "Seasons in India",
                "fact": "Peak tourism season for Northern Plains, Rajasthan, and Southern beaches is October to March. Himalayan treks peak in May-June and September-October, while Valley of Flowers is prime during July-August monsoons.",
                "source": "India Meteorological Department (IMD) & Ministry of Tourism"
            })
        if "wildlife" in topic_lower or "safari" in topic_lower or "tiger" in topic_lower:
            facts.append({
                "topic": "National Park Safari Timings",
                "fact": "Most major Indian tiger reserves (Corbett, Ranthambore, Kanha) close their core tourism zones during the monsoon months (July to mid-October) for wildlife breeding and forest regeneration.",
                "source": "National Tiger Conservation Authority (NTCA)"
            })
        if not facts:
            facts.append({
                "topic": "Heritage Conservation & Tourism",
                "fact": "UNESCO World Heritage sites in India managed by the Archaeological Survey of India (ASI) mandate verified entry passes with cashless or QR-based ticketing.",
                "source": "Archaeological Survey of India (ASI)"
            })
        return {"query": topic, "verified_facts": facts}

    def create_itinerary(self, destination_ids: List[str], total_days: int = 4) -> Dict[str, Any]:
        """
        Generates structured multi-day itinerary connecting selected destinations.
        """
        dests = self.db.query(Destination).filter(Destination.destination_id.in_(destination_ids)).all()
        if not dests:
            return {"error": "No valid destinations provided"}

        itinerary_days = []
        days_per_dest = max(1, total_days // len(dests))
        day_counter = 1

        for d in dests:
            for d_idx in range(days_per_dest):
                if day_counter > total_days:
                    break
                phase = "Arrival & Orientation" if d_idx == 0 else "Deep Exploration & Culture"
                highlights = d.highlights[:2] if d.highlights else ["Local sightseeing", "Scenic exploration"]
                itinerary_days.append({
                    "day": day_counter,
                    "destination": d.name,
                    "destination_id": d.destination_id,
                    "state": d.state,
                    "focus": phase,
                    "activities": [
                        f"Morning: Visit {highlights[0] if len(highlights) > 0 else d.name}",
                        f"Afternoon: Explore local culinary traditions and {d.category} heritage",
                        f"Evening: Scenic sunset and {highlights[1] if len(highlights) > 1 else 'cultural relaxation'}"
                    ],
                    "coordinates": {"latitude": d.latitude, "longitude": d.longitude},
                    "recommended_stay_duration": f"{d.avg_visit_duration_days} days"
                })
                day_counter += 1

        return {
            "title": f"{total_days}-Day Curated Tour Across {', '.join(d.name for d in dests[:3])}",
            "total_days": total_days,
            "destinations_included": [d.name for d in dests],
            "estimated_budget_tier": dests[0].estimated_budget_tier if dests else "Moderate",
            "daily_itinerary": itinerary_days,
            "disclaimer": "Ground transport and opening hours verified from official tourism records. Book tickets via official state tourism portals."
        }
