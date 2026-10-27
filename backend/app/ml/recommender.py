import json
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.destination import Destination
from backend.app.models.warehouse import DimTourist, FactTourismVisit
from backend.app.ml.clustering import TouristBehaviourMiner

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

CATEGORY_TAG_VECTORS = {
    "nature": ["nature", "scenic", "himalayas", "lake", "waterfall", "forest"],
    "culture": ["culture", "heritage", "history", "architecture", "monument", "unesco"],
    "adventure": ["adventure", "trekking", "high-altitude", "rafting", "snow", "caves"],
    "relaxation": ["relaxation", "beach", "coastal", "island", "sunset", "tea", "houseboat"],
    "wildlife": ["wildlife", "safari", "tiger", "rhino", "national-park", "forest"],
    "spirituality": ["spirituality", "temple", "ghats", "pilgrimage", "yoga"]
}

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))


class DestinationRecommender:
    def __init__(self, db: Session):
        self.db = db
        self.miner = TouristBehaviourMiner(db)

    def _build_destination_vector(self, dest: Destination) -> List[float]:
        tags = [t.lower() for t in dest.tags]
        category_lower = dest.category.lower()
        
        vec = []
        for cat, keywords in CATEGORY_TAG_VECTORS.items():
            score = 0.0
            for kw in keywords:
                if kw in tags or kw in category_lower:
                    score += 0.3
            if cat in category_lower:
                score += 0.4
            vec.append(min(1.0, score))

        # Budget vector representation: Low=0.2, Moderate=0.5, Luxury=0.9
        b_tier = dest.estimated_budget_tier.lower()
        budget_val = 0.2 if "budget" in b_tier else (0.9 if "luxury" in b_tier else 0.5)
        vec.append(budget_val)

        # Duration vector: normalized to 10 days
        vec.append(min(1.0, dest.avg_visit_duration_days / 10.0))
        return vec

    def _build_user_vector(self, profile: Dict[str, Any]) -> List[float]:
        vec = [
            float(profile.get("nature_affinity", 0.5)),
            float(profile.get("culture_affinity", 0.5)),
            float(profile.get("adventure_affinity", 0.5)),
            float(profile.get("relaxation_affinity", 0.5)),
            float(profile.get("wildlife_affinity", 0.5)),
            float(profile.get("spirituality_affinity", profile.get("culture_affinity", 0.5))),
        ]
        b_tier = str(profile.get("budget_tier", "moderate")).lower()
        budget_val = 0.2 if "budget" in b_tier or "low" in b_tier else (0.9 if "luxury" in b_tier or "premium" in b_tier else 0.5)
        vec.append(budget_val)

        dur_days = float(profile.get("duration_days", 3.0))
        vec.append(min(1.0, dur_days / 10.0))
        return vec

    def _get_cluster_destination_scores(self, cluster_id: int) -> Dict[int, float]:
        """
        Calculates normalized visit frequency for destinations visited by tourists in cluster_id.
        """
        tourists_in_cluster = self.db.query(DimTourist.tourist_key).filter(
            DimTourist.assigned_cluster == cluster_id
        ).scalar_subquery()

        visits = self.db.query(FactTourismVisit.destination_key).filter(
            FactTourismVisit.tourist_key.in_(tourists_in_cluster)
        ).all()

        if not visits:
            return {}

        counts: Dict[int, int] = {}
        for (dest_key,) in visits:
            counts[dest_key] = counts.get(dest_key, 0) + 1

        max_c = max(counts.values()) if counts else 1
        return {k: round(v / max_c, 3) for k, v in counts.items()}

    def recommend(
        self,
        profile: Dict[str, Any],
        target_month: Optional[str] = None,
        region_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        state_filter: Optional[str] = None,
        exclude_visited_ids: Optional[List[str]] = None,
        top_k: int = 6
    ) -> Dict[str, Any]:
        """
        Multi-criteria hybrid recommendation combining:
        1. Content-based cosine similarity (40%)
        2. Cluster-level tourist preference matching (25%)
        3. Seasonality match (15%)
        4. Popularity signal with logarithmic damping (20%)
        """
        exclude_visited_ids = set(exclude_visited_ids or [])

        # 1. Predict user cluster
        cluster_prediction = self.miner.predict_tourist_cluster(profile)
        predicted_cluster = cluster_prediction["predicted_cluster"]
        cluster_label = cluster_prediction["cluster_label"]
        cluster_dest_scores = self._get_cluster_destination_scores(predicted_cluster)

        # 2. Get destination pool
        query = self.db.query(Destination)
        if region_filter:
            query = query.filter(Destination.region == region_filter)
        if category_filter:
            query = query.filter(Destination.category == category_filter)
        if state_filter:
            query = query.filter(Destination.state == state_filter)

        destinations = query.all()
        if not destinations:
            # Fallback to all if strict filter yielded no results
            destinations = self.db.query(Destination).all()

        current_month = target_month or datetime.utcnow().strftime("%B")
        user_vec = self._build_user_vector(profile)

        ranked = []
        for dest in destinations:
            if dest.destination_id in exclude_visited_ids:
                continue

            dest_vec = self._build_destination_vector(dest)

            # Component 1: Content Similarity
            content_sim = cosine_similarity(user_vec, dest_vec)

            # Component 2: Cluster Affinity
            cluster_affinity = cluster_dest_scores.get(dest.destination_key, 0.4)

            # Component 3: Seasonality
            best_months = [m.lower() for m in dest.best_months]
            is_in_season = (current_month.lower() in best_months) or (len(best_months) == 0)
            seasonality_score = 1.0 if is_in_season else 0.5

            # Component 4: Popularity Signal (log-damped)
            raw_pop = dest.popularity_score or 75.0
            popularity_signal = min(1.0, math.log(1.0 + raw_pop) / math.log(1.0 + 100.0))

            # Composite Score (Normalized 0.0 to 1.0)
            w_content = 0.40
            w_cluster = 0.25
            w_season = 0.15
            w_popularity = 0.20

            final_score = (
                (w_content * content_sim)
                + (w_cluster * cluster_affinity)
                + (w_season * seasonality_score)
                + (w_popularity * popularity_signal)
            )

            # Matched interests & rationale explanation
            matched_interests = []
            if profile.get("nature_affinity", 0.5) > 0.6 and ("nature" in dest.tags or "Mountains" in dest.category):
                matched_interests.append("High Nature & Mountain Affinity")
            if profile.get("culture_affinity", 0.5) > 0.6 and ("culture" in dest.tags or "Heritage" in dest.category):
                matched_interests.append("Rich Heritage & Cultural Alignment")
            if profile.get("adventure_affinity", 0.5) > 0.6 and ("adventure" in dest.tags or "trekking" in dest.tags):
                matched_interests.append("Active Outdoor Adventure")
            if profile.get("relaxation_affinity", 0.5) > 0.6 and ("relaxation" in dest.tags or "beach" in dest.tags):
                matched_interests.append("Tranquil Coastal Relaxation")
            if is_in_season:
                matched_interests.append(f"Optimal Season in {current_month}")

            rationale = (
                f"Scored {round(final_score * 100, 1)}% overall match. "
                f"Strong alignment with {cluster_label} preferences ({round(cluster_affinity * 100)}% cluster affinity). "
                f"Content similarity index is {round(content_sim * 100)}% with {dest.category} in {dest.state}."
            )

            ranked.append({
                "destination_id": dest.destination_id,
                "name": dest.name,
                "category": dest.category,
                "state": dest.state,
                "region": dest.region,
                "latitude": dest.latitude,
                "longitude": dest.longitude,
                "elevation_m": dest.elevation_m,
                "short_description": dest.short_description,
                "cover_image": dest.cover_image,
                "rating": dest.rating,
                "estimated_budget_tier": dest.estimated_budget_tier,
                "typical_spend_inr": dest.typical_spend_inr,
                "avg_visit_duration_days": dest.avg_visit_duration_days,
                "best_season": dest.best_season,
                "highlights": dest.highlights,
                "tags": dest.tags,
                "recommendation_score": round(final_score * 100, 1),
                "component_scores": {
                    "content_similarity": round(content_sim * 100, 1),
                    "cluster_affinity": round(cluster_affinity * 100, 1),
                    "seasonality_match": round(seasonality_score * 100, 1),
                    "popularity_signal": round(popularity_signal * 100, 1)
                },
                "matched_interests": matched_interests,
                "evidence_rationale": rationale,
                "source_attribution": dest.image_attribution
            })

        # Sort by recommendation score descending
        ranked.sort(key=lambda x: x["recommendation_score"], reverse=True)
        top_destinations = ranked[:top_k]

        return {
            "predicted_tourist_cluster": predicted_cluster,
            "cluster_label": cluster_label,
            "target_travel_month": current_month,
            "total_candidates_evaluated": len(ranked),
            "recommendations": top_destinations,
            "model_weights": {
                "content_similarity_weight": 0.40,
                "cluster_affinity_weight": 0.25,
                "seasonality_weight": 0.15,
                "popularity_signal_weight": 0.20
            }
        }
