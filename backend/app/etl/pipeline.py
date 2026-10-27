import json
import logging
import random
import uuid
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.destination import Destination
from backend.app.models.warehouse import (
    DimTourist,
    DimDate,
    DimTrip,
    DimGeography,
    FactTourismVisit,
    FactDestinationInteraction,
    ETLLog
)

logger = logging.getLogger(__name__)

# Canonical category mapping
CATEGORY_MAPPINGS = {
    "heritage & monuments": "Heritage & Monuments",
    "heritage": "Heritage & Monuments",
    "monuments": "Heritage & Monuments",
    "mountains & trekking": "Mountains & Trekking",
    "mountains": "Mountains & Trekking",
    "trekking": "Mountains & Trekking",
    "hill stations": "Hill Stations",
    "hill station": "Hill Stations",
    "beaches & islands": "Beaches & Islands",
    "beaches": "Beaches & Islands",
    "beach": "Beaches & Islands",
    "national parks & wildlife": "National Parks & Wildlife",
    "wildlife": "National Parks & Wildlife",
    "national park": "National Parks & Wildlife",
    "temples & cultural attractions": "Temples & Cultural Attractions",
    "temples": "Temples & Cultural Attractions",
    "cultural": "Temples & Cultural Attractions",
    "cities & urban attractions": "Cities & Urban Attractions",
    "cities": "Cities & Urban Attractions",
    "famous streets & promenades": "Famous Streets & Promenades",
    "streets": "Famous Streets & Promenades",
    "lakes, rivers & waterfalls": "Lakes, Rivers & Waterfalls",
    "lakes": "Lakes, Rivers & Waterfalls",
    "waterfalls": "Lakes, Rivers & Waterfalls"
}

STATE_REGION_MAP = {
    "Uttar Pradesh": ("Northern", "North Zone", "Lucknow"),
    "Delhi": ("Northern", "North Zone", "New Delhi"),
    "Punjab": ("Northern", "North Zone", "Chandigarh"),
    "Rajasthan": ("Western", "West Zone", "Jaipur"),
    "Maharashtra": ("Western", "West Zone", "Mumbai"),
    "Goa": ("Western", "West Zone", "Panaji"),
    "Kerala": ("Southern", "South Zone", "Thiruvananthapuram"),
    "Karnataka": ("Southern", "South Zone", "Bengaluru"),
    "Tamil Nadu": ("Southern", "South Zone", "Chennai"),
    "Himachal Pradesh": ("Himalayan", "North Zone", "Shimla"),
    "Uttarakhand": ("Himalayan", "North Zone", "Dehradun"),
    "Jammu & Kashmir": ("Himalayan", "North Zone", "Srinagar"),
    "Ladakh": ("Himalayan", "North Zone", "Leh"),
    "Assam": ("North-Eastern", "North East Zone", "Dispur"),
    "Meghalaya": ("North-Eastern", "North East Zone", "Shillong"),
    "Sikkim": ("North-Eastern", "North East Zone", "Gangtok"),
    "Andaman & Nicobar Islands": ("Southern", "Island Zone", "Port Blair"),
    "West Bengal": ("Eastern", "East Zone", "Kolkata"),
    "Madhya Pradesh": ("Central", "Central Zone", "Bhopal")
}

def determine_season(month: int) -> str:
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Summer"
    elif month in [6, 7, 8, 9]:
        return "Monsoon"
    else:
        return "Post-Monsoon"


class TourismETLPipeline:
    def __init__(self, db: Session, raw_file_path: str = None):
        self.db = db
        self.raw_file_path = raw_file_path or settings.RAW_DATA_PATH
        self.batch_id = f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        self.quality_report: Dict[str, Any] = {
            "batch_id": self.batch_id,
            "raw_records_read": 0,
            "validation_failures": 0,
            "cleaned_records": 0,
            "duplicates_removed": 0,
            "destinations_loaded": 0,
            "geographies_loaded": 0,
            "dates_loaded": 0,
            "trips_loaded": 0,
            "tourists_loaded": 0,
            "visits_loaded": 0,
            "interactions_loaded": 0,
            "validation_errors": []
        }

    def run(self) -> Dict[str, Any]:
        """
        Executes complete ETL pipeline:
        Extract -> Validate -> Clean -> Transform -> Load -> Evaluate
        """
        etl_log = ETLLog(
            batch_id=self.batch_id,
            started_at=datetime.utcnow(),
            status="RUNNING"
        )
        self.db.add(etl_log)
        self.db.commit()

        try:
            # 1. EXTRACT
            raw_destinations = self._extract()

            # 2. VALIDATE & CLEAN
            cleaned_destinations = self._validate_and_clean(raw_destinations)

            # 3. TRANSFORM & LOAD DIMENSIONS
            self._load_geographies(cleaned_destinations)
            self._load_dates()
            self._load_trips()
            self._load_destinations(cleaned_destinations)

            # 4. SYNTHESIZE & LOAD TOURISTS AND FACTS
            self._load_academic_benchmark_tourists_and_facts()

            # 5. COMPLETE AUDIT LOG
            etl_log.completed_at = datetime.utcnow()
            etl_log.status = "SUCCESS"
            etl_log.records_extracted = self.quality_report["raw_records_read"]
            etl_log.records_cleaned = self.quality_report["cleaned_records"]
            etl_log.records_loaded = (
                self.quality_report["destinations_loaded"]
                + self.quality_report["tourists_loaded"]
                + self.quality_report["visits_loaded"]
            )
            etl_log.quality_report_json = json.dumps(self.quality_report)
            self.db.commit()

            logger.info("ETL Pipeline completed successfully: %s", self.batch_id)
            return self.quality_report

        except Exception as e:
            self.db.rollback()
            etl_log.completed_at = datetime.utcnow()
            etl_log.status = "FAILED"
            etl_log.error_message = str(e)
            etl_log.quality_report_json = json.dumps(self.quality_report)
            self.db.commit()
            logger.error("ETL Pipeline failed: %s", str(e), exc_info=True)
            raise e

    def _extract(self) -> List[Dict[str, Any]]:
        path = Path(self.raw_file_path)
        if not path.exists():
            raise FileNotFoundError(f"Raw dataset file not found at {self.raw_file_path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.quality_report["raw_records_read"] = len(data)
        return data

    def _validate_and_clean(self, raw_records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = []
        seen_ids = set()

        for idx, rec in enumerate(raw_records):
            dest_id = rec.get("destination_id", "").strip()
            name = rec.get("name", "").strip()
            state = rec.get("state", "").strip()
            lat = rec.get("latitude")
            lon = rec.get("longitude")

            # Check required fields
            if not dest_id or not name or lat is None or lon is None:
                self.quality_report["validation_failures"] += 1
                self.quality_report["validation_errors"].append(
                    f"Row {idx}: Missing mandatory destination_id, name, or coordinates."
                )
                continue

            # Check coordinate bounds for India (Lat 6.0 - 38.0, Lon 68.0 - 98.0)
            try:
                lat = float(lat)
                lon = float(lon)
                if not (6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0):
                    self.quality_report["validation_failures"] += 1
                    self.quality_report["validation_errors"].append(
                        f"Row {idx} ({name}): Coordinates ({lat}, {lon}) outside India bounding box."
                    )
                    continue
            except (ValueError, TypeError):
                self.quality_report["validation_failures"] += 1
                self.quality_report["validation_errors"].append(
                    f"Row {idx} ({name}): Invalid coordinate data type."
                )
                continue

            # Deduplication
            if dest_id in seen_ids:
                self.quality_report["duplicates_removed"] += 1
                continue
            seen_ids.add(dest_id)

            # Category normalization
            raw_cat = rec.get("category", "").lower().strip()
            category = CATEGORY_MAPPINGS.get(raw_cat, rec.get("category", "General Heritage").strip())

            # State normalization
            if state == "Jammu and Kashmir":
                state = "Jammu & Kashmir"

            # Image fallback
            cover_img = rec.get("cover_image", "").strip()
            if not cover_img:
                cover_img = "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"

            cleaned_rec = dict(rec)
            cleaned_rec["destination_id"] = dest_id
            cleaned_rec["name"] = name
            cleaned_rec["state"] = state
            cleaned_rec["category"] = category
            cleaned_rec["latitude"] = lat
            cleaned_rec["longitude"] = lon
            cleaned_rec["cover_image"] = cover_img
            cleaned_rec["rating"] = min(5.0, max(1.0, float(rec.get("rating", 4.5))))
            cleaned_rec["elevation_m"] = max(0.0, float(rec.get("elevation_m", 0.0)))

            cleaned.append(cleaned_rec)

        self.quality_report["cleaned_records"] = len(cleaned)
        return cleaned

    def _load_geographies(self, cleaned_records: List[Dict[str, Any]]):
        states = set(r["state"] for r in cleaned_records)
        count = 0
        for state in states:
            geo_info = STATE_REGION_MAP.get(state, ("Northern", "General Zone", state))
            existing = self.db.query(DimGeography).filter_by(state=state).first()
            if not existing:
                geo = DimGeography(
                    state=state,
                    region=geo_info[0],
                    zone=geo_info[1],
                    capital=geo_info[2]
                )
                self.db.add(geo)
                count += 1
        self.db.commit()
        self.quality_report["geographies_loaded"] = count

    def _load_dates(self):
        # Generate calendar dimension for 2024 to 2026
        existing_count = self.db.query(DimDate).count()
        if existing_count > 700:
            self.quality_report["dates_loaded"] = existing_count
            return

        start_date = date(2024, 1, 1)
        end_date = date(2026, 12, 31)
        curr = start_date
        count = 0

        while curr <= end_date:
            date_key = int(curr.strftime("%Y%m%d"))
            month = curr.month
            season = determine_season(month)
            quarter = (month - 1) // 3 + 1
            is_wknd = curr.weekday() in [5, 6]

            d_dim = DimDate(
                date_key=date_key,
                full_date=curr.strftime("%Y-%m-%d"),
                day=curr.day,
                month=month,
                month_name=curr.strftime("%B"),
                quarter=quarter,
                year=curr.year,
                season=season,
                is_weekend=is_wknd
            )
            self.db.add(d_dim)
            curr += timedelta(days=1)
            count += 1
            if count % 300 == 0:
                self.db.flush()

        self.db.commit()
        self.quality_report["dates_loaded"] = count

    def _load_trips(self):
        existing_count = self.db.query(DimTrip).count()
        if existing_count > 0:
            self.quality_report["trips_loaded"] = existing_count
            return

        purposes = ["Leisure", "Adventure", "Heritage", "Pilgrimage", "Eco-tourism", "Relaxation"]
        budgets = ["Low", "Mid", "Premium"]
        durations = ["Short (1-2 days)", "Medium (3-5 days)", "Long (6+ days)"]
        parties = ["Solo", "Couple", "Family", "Friends"]
        transports = ["Train", "Flight", "Road / Car", "Bus"]

        trip_id = 1
        for p in purposes:
            for b in budgets:
                for d in durations:
                    for pt in parties:
                        t = DimTrip(
                            trip_id=f"TRIP_TPL_{trip_id}",
                            purpose=p,
                            budget_band=b,
                            duration_band=d,
                            travel_party=pt,
                            transport_preference=random.choice(transports)
                        )
                        self.db.add(t)
                        trip_id += 1

        self.db.commit()
        self.quality_report["trips_loaded"] = trip_id - 1

    def _load_destinations(self, cleaned_records: List[Dict[str, Any]]):
        count = 0
        for r in cleaned_records:
            existing = self.db.query(Destination).filter_by(destination_id=r["destination_id"]).first()
            if existing:
                # Update properties
                existing.name = r["name"]
                existing.category = r["category"]
                existing.state = r["state"]
                existing.region = r.get("region", "Northern")
                existing.latitude = r["latitude"]
                existing.longitude = r["longitude"]
                existing.elevation_m = r["elevation_m"]
                existing.short_description = r["short_description"]
                existing.detailed_description = r["detailed_description"]
                existing.highlights_json = json.dumps(r.get("highlights", []))
                existing.tags_json = json.dumps(r.get("tags", []))
                existing.best_season = r.get("best_season", "October to March")
                existing.best_months_json = json.dumps(r.get("best_months", []))
                existing.avg_visit_duration_days = float(r.get("avg_visit_duration_days", 2.0))
                existing.estimated_budget_tier = r.get("estimated_budget_tier", "Moderate")
                existing.typical_spend_inr = float(r.get("typical_spend_inr", 5000.0))
                existing.family_friendly = bool(r.get("family_friendly", True))
                existing.accessibility_rating = float(r.get("accessibility_rating", 3.5))
                existing.rating = float(r.get("rating", 4.5))
                existing.review_count = int(r.get("review_count", 100))
                existing.popularity_score = float(r.get("popularity_score", 85.0))
                existing.cover_image = r["cover_image"]
                existing.gallery_json = json.dumps(r.get("gallery", []))
                existing.image_attribution = r.get("image_attribution", "Wikimedia Commons")
                existing.image_license = r.get("image_license", "CC BY-SA 4.0")
                existing.entry_fee_info = r.get("entry_fee_info", "Verified local tourism board")
                existing.opening_hours_info = r.get("opening_hours_info", "Open daily")
                existing.source_name = r.get("source_name", "Tourism India")
                existing.source_url = r.get("source_url", "https://tourism.gov.in")
                existing.last_verified_date = r.get("last_verified_date", "2026-03-01")
            else:
                dest = Destination(
                    destination_id=r["destination_id"],
                    name=r["name"],
                    category=r["category"],
                    state=r["state"],
                    region=r.get("region", "Northern"),
                    latitude=r["latitude"],
                    longitude=r["longitude"],
                    elevation_m=r["elevation_m"],
                    short_description=r["short_description"],
                    detailed_description=r["detailed_description"],
                    highlights_json=json.dumps(r.get("highlights", [])),
                    tags_json=json.dumps(r.get("tags", [])),
                    best_season=r.get("best_season", "October to March"),
                    best_months_json=json.dumps(r.get("best_months", [])),
                    avg_visit_duration_days=float(r.get("avg_visit_duration_days", 2.0)),
                    estimated_budget_tier=r.get("estimated_budget_tier", "Moderate"),
                    typical_spend_inr=float(r.get("typical_spend_inr", 5000.0)),
                    family_friendly=bool(r.get("family_friendly", True)),
                    accessibility_rating=float(r.get("accessibility_rating", 3.5)),
                    rating=float(r.get("rating", 4.5)),
                    review_count=int(r.get("review_count", 100)),
                    popularity_score=float(r.get("popularity_score", 85.0)),
                    cover_image=r["cover_image"],
                    gallery_json=json.dumps(r.get("gallery", [])),
                    image_attribution=r.get("image_attribution", "Wikimedia Commons"),
                    image_license=r.get("image_license", "CC BY-SA 4.0"),
                    entry_fee_info=r.get("entry_fee_info", "Verified local tourism board"),
                    opening_hours_info=r.get("opening_hours_info", "Open daily"),
                    source_name=r.get("source_name", "Tourism India"),
                    source_url=r.get("source_url", "https://tourism.gov.in"),
                    last_verified_date=r.get("last_verified_date", "2026-03-01")
                )
                self.db.add(dest)
            count += 1
        self.db.commit()
        self.quality_report["destinations_loaded"] = count

    def _load_academic_benchmark_tourists_and_facts(self):
        """
        Synthesizes high-fidelity academic benchmark tourist profiles and visits.
        Clearly sets is_synthetic=True on all generated visits to distinguish from real statistics.
        """
        existing_tourists = self.db.query(DimTourist).count()
        if existing_tourists >= 250:
            self.quality_report["tourists_loaded"] = existing_tourists
            self.quality_report["visits_loaded"] = self.db.query(FactTourismVisit).count()
            self.quality_report["interactions_loaded"] = self.db.query(FactDestinationInteraction).count()
            return

        destinations = self.db.query(Destination).all()
        date_keys = [d.date_key for d in self.db.query(DimDate).filter(DimDate.year.in_([2024, 2025, 2026])).all()]
        trip_keys = [t.trip_key for t in self.db.query(DimTrip).all()]

        if not destinations or not date_keys or not trip_keys:
            logger.warning("Prerequisite dimensions empty; skipping synthetic fact generation.")
            return

        # Archetypes for diverse tourist behavior mining:
        # 1. Nature & Trekking Explorers
        # 2. Culture & Heritage Travellers
        # 3. High-Adrenaline Adventure Seekers
        # 4. Coastal & Relaxation Vacationers
        # 5. Budget Urban Explorers
        archetypes = [
            {"label": "Nature & Trekking Explorers", "nature": (0.75, 1.0), "culture": (0.1, 0.4), "adv": (0.6, 0.9), "relax": (0.2, 0.5), "budget": "Moderate", "spend": (8000, 18000)},
            {"label": "Culture & Heritage Travellers", "nature": (0.2, 0.5), "culture": (0.75, 1.0), "adv": (0.1, 0.3), "relax": (0.3, 0.6), "budget": "Moderate", "spend": (6000, 16000)},
            {"label": "Adventure Seekers", "nature": (0.6, 0.9), "culture": (0.1, 0.4), "adv": (0.8, 1.0), "relax": (0.1, 0.4), "budget": "Moderate", "spend": (10000, 22000)},
            {"label": "Relaxation & Beach Travellers", "nature": (0.3, 0.6), "culture": (0.1, 0.3), "adv": (0.1, 0.4), "relax": (0.8, 1.0), "budget": "Luxury", "spend": (12000, 35000)},
            {"label": "Budget Urban Explorers", "nature": (0.2, 0.5), "culture": (0.5, 0.8), "adv": (0.3, 0.6), "relax": (0.3, 0.6), "budget": "Budget", "spend": (3000, 7500)},
        ]

        age_groups = ["18-24", "25-34", "35-44", "45-54", "55+"]
        party_types = ["Solo", "Couple", "Family", "Group"]
        countries = ["India", "India", "India", "India", "United States", "United Kingdom", "Germany", "France", "Australia"]

        tourist_objs = []
        num_tourists = 300

        for i in range(1, num_tourists + 1):
            arch = random.choice(archetypes)
            t = DimTourist(
                tourist_id=f"tourist_in_{1000 + i}",
                origin_country=random.choice(countries),
                origin_state=random.choice(list(STATE_REGION_MAP.keys())),
                age_group=random.choice(age_groups),
                travel_party_type=random.choice(party_types),
                nature_affinity=round(random.uniform(*arch["nature"]), 3),
                culture_affinity=round(random.uniform(*arch["culture"]), 3),
                adventure_affinity=round(random.uniform(*arch["adv"]), 3),
                relaxation_affinity=round(random.uniform(*arch["relax"]), 3),
                wildlife_affinity=round(random.uniform(0.1, 0.9), 3),
                heritage_affinity=round(random.uniform(*arch["culture"]), 3),
                preferred_budget_tier=arch["budget"],
                avg_spend_per_trip=round(random.uniform(*arch["spend"]), 2),
                trip_duration_preference_days=round(random.uniform(1.5, 7.0), 1),
                assigned_cluster=-1,
                cluster_label=arch["label"]
            )
            self.db.add(t)
            tourist_objs.append(t)

        self.db.flush()
        self.quality_report["tourists_loaded"] = len(tourist_objs)

        # Generate FactTourismVisits
        visits_count = 0
        interactions_count = 0

        dest_by_category = {}
        for d in destinations:
            dest_by_category.setdefault(d.category, []).append(d)

        interaction_types = ["view", "click", "search", "save", "3d_explore"]

        for t in tourist_objs:
            # 3 to 7 visits per tourist
            num_visits = random.randint(3, 7)
            for _ in range(num_visits):
                # Pick destination aligned with affinity
                if t.nature_affinity > 0.6 and "Mountains & Trekking" in dest_by_category:
                    dest = random.choice(dest_by_category["Mountains & Trekking"] + dest_by_category.get("Lakes, Rivers & Waterfalls", []))
                elif t.culture_affinity > 0.6 and "Heritage & Monuments" in dest_by_category:
                    dest = random.choice(dest_by_category["Heritage & Monuments"] + dest_by_category.get("Temples & Cultural Attractions", []))
                elif t.relaxation_affinity > 0.6 and "Beaches & Islands" in dest_by_category:
                    dest = random.choice(dest_by_category["Beaches & Islands"] + dest_by_category.get("Hill Stations", []))
                else:
                    dest = random.choice(destinations)

                d_key = random.choice(date_keys)
                tr_key = random.choice(trip_keys)
                duration = max(1.0, round(t.trip_duration_preference_days * random.uniform(0.8, 1.3), 1))
                spend = max(1000.0, round(t.avg_spend_per_trip * random.uniform(0.7, 1.4), 2))
                satisfaction = round(random.uniform(3.5, 5.0), 2)
                party_size = 1 if t.travel_party_type == "Solo" else (2 if t.travel_party_type == "Couple" else random.randint(3, 6))

                visit = FactTourismVisit(
                    tourist_key=t.tourist_key,
                    destination_key=dest.destination_key,
                    date_key=d_key,
                    trip_key=tr_key,
                    visit_duration_days=duration,
                    estimated_spend_inr=spend,
                    satisfaction_score=satisfaction,
                    travel_party_size=party_size,
                    visit_count=1,
                    is_synthetic=True
                )
                self.db.add(visit)
                visits_count += 1

                # Generate 2 to 4 interactions per visit
                for _ in range(random.randint(2, 4)):
                    inter = FactDestinationInteraction(
                        tourist_key=t.tourist_key,
                        session_id=f"sess_{uuid.uuid4().hex[:10]}",
                        destination_key=dest.destination_key,
                        date_key=d_key,
                        interaction_type=random.choice(interaction_types),
                        dwell_time_seconds=round(random.uniform(5.0, 180.0), 1),
                        source_channel=random.choice(["web_3d_explorer", "recommendation_engine", "directory_search"])
                    )
                    self.db.add(inter)
                    interactions_count += 1

            if visits_count % 300 == 0:
                self.db.flush()

        self.db.commit()
        self.quality_report["visits_loaded"] = visits_count
        self.quality_report["interactions_loaded"] = interactions_count
